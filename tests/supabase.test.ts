import { describe, it, expect } from "vitest";
import { supabase } from "../client/src/lib/supabaseClient";

describe("Supabase basic connectivity", () => {
  it("should list accidents without error", async () => {
    const { data, error } = await supabase.from("accidents").select("*").limit(1);
    expect(error).toBeNull();
    expect(data).toBeInstanceOf(Array);
  });
});