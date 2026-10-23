import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
const url = process.env["RESERVATION_TEST_DB_URL"];
const suite = url ? describe : describe.skip;
if (url && !/^postgres:\/\/[^@]+@(localhost|127\.0\.0\.1):55439\//.test(url))
  throw new Error("Reservation database tests require the isolated local database.");
const STAFF = "11111111-1111-4111-8111-111111111111";
const DAY = "2026-10-31";
suite("six-lane reservation database rules", () => {
  const sql = postgres(url ?? "", { max: 4, onnotice: () => {} });
  const key = () => crypto.randomUUID();
  const contact = { contact_name: "Test Customer", email: "test@example.com", phone: "7805550100" };
  async function as(role: "anon" | "staff", fn: (t: postgres.TransactionSql) => Promise<unknown>) {
    return sql.begin(async (t) => {
      await t`select set_config('request.jwt.claim.sub',${role === "staff" ? STAFF : ""},true)`;
      await t.unsafe(role === "staff" ? "set local role authenticated" : "set local role anon");
      return fn(t);
    });
  }
  const save = (p: Record<string, unknown>, role: "anon" | "staff" = "staff", id?: string) =>
    as(role, (t) =>
      id
        ? t`select reservation_save(${t.json(p as never)},${id}::uuid) r`
        : t`select reservation_save(${t.json(p as never)}) r`,
    ).then((r) => {
      const row = (r as { r: { received: boolean; duration: number; lanes: number[]; id: string } }[])[0];
      if (!row) throw new Error("No saved result");
      return row.r;
    });
  const available = (alloc: number[], games = 3) =>
    as(
      "anon",
      (t) => t`select reservation_available(${DAY}::date,${alloc}::integer[],${games}) r`,
    ).then((r) => {
      const row = (
        r as { r: { slots: { time: string; available: number }[]; duration: number } }[]
      )[0];
      if (!row) throw new Error("No availability result");
      return row.r;
    });
  beforeAll(async () => {
    await sql`update reservation_settings set config=jsonb_set(config,'{enabled}','true')`;
  });
  beforeEach(async () => {
    await sql`delete from reservation_audit`;
    await sql`delete from booking_requests`;
    await sql`delete from lane_reservations`;
    await sql`delete from lane_schedule_blocks`;
    await sql`delete from reservation_date_hours`;
    await sql`delete from booking_requests`;
  });
  afterAll(async () => {
    await sql.end();
  });
  it("1–3: books one bowler and six bowlers for three games with estimated durations", async () => {
    expect(
      (
        await save({
          ...contact,
          request_key: key(),
          day: DAY,
          time: "10:30",
          allocations: [1],
          games: 3,
        })
      ).duration,
    ).toBe(60);
    expect(
      (
        await save({
          ...contact,
          request_key: key(),
          day: DAY,
          time: "10:30",
          allocations: [6],
          games: 3,
        })
      ).duration,
    ).toBe(180);
  });
  it("4–5: books multiple lanes and leaves four after two are occupied", async () => {
    expect(
      (
        await save({
          ...contact,
          request_key: key(),
          day: DAY,
          time: "12:00",
          allocations: [3, 3],
          games: 2,
        })
      ).lanes,
    ).toEqual([1, 2]);
    expect((await available([1], 1)).slots.find((s) => s.time === "12:00")?.available).toBe(4);
  });
  it("6–7,11,13: full lanes block the whole occupied interval and reject overlaps", async () => {
    await save({
      ...contact,
      request_key: key(),
      day: DAY,
      time: "14:00",
      allocations: [6, 6, 6, 6, 6, 6],
      games: 1,
    });
    expect((await available([1], 1)).slots.some((s) => s.time === "14:30")).toBe(false);
    await expect(
      save({ ...contact, request_key: key(), day: DAY, time: "14:59", allocations: [1], games: 1 }),
    ).rejects.toThrow(/no longer available/);
    expect(
      (
        await save({
          ...contact,
          request_key: key(),
          day: DAY,
          time: "15:00",
          allocations: [1],
          games: 1,
        })
      ).received,
    ).toBe(true);
  });
  it("8–10: lane, recurring and one-time schedule rules change availability", async () => {
    await as(
      "staff",
      (t) =>
        t`select reservation_staff('block',${t.json({ title: "Maintenance", lanes: [1], starts_on: DAY, ends_on: DAY, weekday: null, start_minute: 600, end_minute: 1320, exceptions: [] })})`,
    );
    expect((await available([1], 1)).slots.find((s) => s.time === "12:00")?.available).toBe(5);
    await as(
      "staff",
      (t) =>
        t`select reservation_staff('block',${t.json({ title: "League", lanes: [2, 3], starts_on: "2026-10-01", ends_on: "2026-12-31", weekday: 6, start_minute: 720, end_minute: 780, exceptions: [] })})`,
    );
    expect((await available([1], 1)).slots.find((s) => s.time === "12:00")?.available).toBe(3);
    await as(
      "staff",
      (t) =>
        t`select reservation_staff('date_hours',${t.json({ day: DAY, windows: [[900, 960]], note: "Special" })})`,
    );
    expect((await available([1], 1)).slots.map((s) => s.time)).toEqual(["15:00", "15:15", "15:30"]);
  });
  it("12: simultaneous requests cannot both take the last lane", async () => {
    await save({
      ...contact,
      request_key: key(),
      day: DAY,
      time: "17:00",
      allocations: [1, 1, 1, 1, 1],
      games: 1,
    });
    const results = await Promise.allSettled([
      save({ ...contact, request_key: key(), day: DAY, time: "17:00", allocations: [1], games: 1 }),
      save({ ...contact, request_key: key(), day: DAY, time: "17:00", allocations: [1], games: 1 }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
  it("14: invalid inputs are rejected clearly", async () => {
    await expect(
      save({ ...contact, request_key: key(), day: DAY, time: "10:30", allocations: [7], games: 1 }),
    ).rejects.toThrow(/1–6 bowlers/);
    await expect(
      save({
        ...contact,
        email: "bad",
        request_key: key(),
        day: DAY,
        time: "10:30",
        allocations: [1],
        games: 1,
      }),
    ).rejects.toThrow(/valid name, email/);
  });
  it("15–16: public visitors cannot read private reservations or staff tools", async () => {
    await expect(as("anon", (t) => t`select * from lane_reservations`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(as("anon", (t) => t`select reservation_staff('read')`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      as(
        "anon",
        (t) =>
          t`insert into lane_occupancy values(gen_random_uuid(),1,tsrange(now()::timestamp,now()::timestamp+interval '1 hour'))`,
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("17: staff can create, reassign, cancel and audit reservations without overlap", async () => {
    const r = await save(
      {
        ...contact,
        request_key: key(),
        day: DAY,
        time: "18:00",
        allocations: [2],
        games: 1,
        lanes: [4],
        status: "confirmed",
      },
      "staff",
    );
    expect(r.lanes).toEqual([4]);
    await save(
      {
        ...contact,
        request_key: key(),
        day: DAY,
        time: "18:00",
        allocations: [2],
        games: 1,
        lanes: [5],
        status: "confirmed",
      },
      "staff",
    );
    await expect(
      save(
        {
          ...contact,
          day: DAY,
          time: "18:00",
          allocations: [2],
          games: 1,
          lanes: [5],
          status: "confirmed",
        },
        "staff",
        r.id as string,
      ),
    ).rejects.toThrow(/conflict/);
    await save(
      {
        ...contact,
        day: DAY,
        time: "18:00",
        allocations: [2],
        games: 1,
        lanes: [4],
        status: "cancelled",
      },
      "staff",
      r.id as string,
    );
    expect(
      Number(
        (await sql`select count(*) from lane_occupancy where reservation_id=${r.id as string}`)[0]
          ?.['count'],
      ),
    ).toBe(0);
    expect(
      Number(
        (
          await sql`select count(*) from reservation_audit where reservation_id=${r.id as string}`
        )[0]?.['count'],
      ),
    ).toBe(2);
  });
  it("19: event inquiries do not reserve lanes", async () => {
    await as(
      "anon",
      (t) =>
        t`select submit_event_inquiry(${t.json({ ...contact, booking_type: "Birthday party", requested_date: DAY, requested_time: "12:00", party_size: 20, notes: "" })})`,
    );
    expect(Number((await sql`select count(*) from booking_requests`)[0]?.['count'])).toBe(1);
    expect(Number((await sql`select count(*) from lane_occupancy`)[0]?.['count'])).toBe(0);
  });
  it("telephone-only: anonymous callers cannot save even when enabled", async () => {
    await expect(save({...contact, request_key:key(), day:DAY,time:"12:00",allocations:[1],games:1},"anon")).rejects.toThrow(/permission denied/);
  });
  it("staff can save without email and adjust duration", async () => {
    const r=await save({...contact,email:"",request_key:key(),day:DAY,time:"12:00",allocations:[2],games:1,duration_minutes:95,status:"confirmed"});
    expect(r.duration).toBe(95); expect(r.lanes).toEqual([1]);
    expect((await sql`select upper(occupied)-lower(occupied) as duration from lane_occupancy where reservation_id=${r.id}`)[0]?.["duration"]).toBe("01:35:00");
  });
  it("staff inquiry stays separate; confirmation reserves lanes and cancellation releases them", async () => {
    const p={...contact,email:"",booking_type:"Birthday Party",requested_date:DAY,requested_time:"12:00",party_size:20,lanes:2,duration_minutes:90,follow_up_status:"inquiry"};
    const result=await as("staff",t=>t`select reservation_inquiry_save(${t.json(p)}) r`) as {r:{id:string}}[];
    const id=result[0]?.r.id; if(!id)throw new Error("Missing inquiry");
    expect(Number((await sql`select count(*) from lane_occupancy`)[0]?.["count"])).toBe(0);
    await as("staff",t=>t`select reservation_inquiry_save(${t.json({...p,follow_up_status:"confirmed"})},${id}::uuid)`);
    expect(Number((await sql`select count(*) from lane_occupancy`)[0]?.["count"])).toBe(2);
    await as("staff",t=>t`select reservation_inquiry_save(${t.json({...p,follow_up_status:"cancelled"})},${id}::uuid)`);
    expect(Number((await sql`select count(*) from lane_occupancy`)[0]?.["count"])).toBe(0);
  });
  it("public cannot manage special events",async()=>{
    await expect(as("anon",t=>t`select reservation_inquiry_save('{}'::jsonb)`)).rejects.toThrow(/permission denied/);
  });
  it("fails closed when booking settings are incomplete", async () => {
    await expect(sql`update reservation_settings set config=config-'enabled'`).rejects.toThrow(
      /incomplete/,
    );
  });
});
