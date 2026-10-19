import { describe, expect, it } from "vitest";

import { userPlanQuery } from "./profiles";

const OWNER_ID = "user-owner";
const OTHER_USER_ID = "user-other";

describe("userPlanQuery", () => {
  it("scopes the profile read to the resolved owner", () => {
    const { sql, params } = userPlanQuery(OWNER_ID).toSQL();

    expect(sql).toContain('from "user_profiles"');
    expect(sql).toContain('"user_profiles"."user_id"');
    expect(sql).toContain("limit");
    expect(params).toContain(OWNER_ID);
    expect(params).not.toContain(OTHER_USER_ID);
  });
});
