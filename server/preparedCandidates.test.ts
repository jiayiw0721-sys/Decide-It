import { describe, expect, it } from "vitest";
import { removePreparedCandidate, togglePreparedCandidate } from "../shared/preparedCandidates";
import type { ChoiceOption } from "../shared/decision";

const first: ChoiceOption = { id: "place-1", label: "地点一", preference: "neutral" };
const second: ChoiceOption = { id: "place-2", label: "地点二", preference: "neutral" };

describe("prepared place candidates", () => {
  it("keeps earlier places when a later search adds another one", () => {
    const afterFirstSearch = togglePreparedCandidate([], first);
    const afterSecondSearch = togglePreparedCandidate(afterFirstSearch, second);
    expect(afterSecondSearch.map((item) => item.id)).toEqual(["place-1", "place-2"]);
  });

  it("allows any prepared place to be removed", () => {
    expect(removePreparedCandidate([first, second], first.id)).toEqual([second]);
  });

  it("uses the same toggle behavior for a repeated map-marker click", () => {
    const afterMarkerClick = togglePreparedCandidate([], first);
    const afterSecondMarkerClick = togglePreparedCandidate(afterMarkerClick, first);
    expect(afterSecondMarkerClick).toEqual([]);
  });
});
