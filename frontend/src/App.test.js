import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

test("shows a focused review and lets users work through the action plan", async () => {
  const report = {
    overview: { summary: "Strong projects, but outcomes need detail.", verdict: "Promising", scores: { overall: 72, ats: 68, content: 74, presentation: 80, impact: 61 } },
    strengths: ["Relevant projects"],
    priorities: [{ severity: "High", title: "Show results", reason: "Impact is unclear.", fix: "Add a supported outcome." }],
    sections: [{ name: "Experience", good: "Clear titles", improve: "Add outcomes" }],
    rewrites: [{ before: "Built a site", after: "Built a customer site", note: "More specific" }],
    ats: { existingKeywords: ["React"], suggestedKeywords: [], concerns: [] },
    actionPlan: { first: ["Add a supported outcome"], next: [], later: [] },
  };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { report, extractedText: "Sample CV text" } }) });

  render(<App />);
  fireEvent.change(document.getElementById("cv-file"), {
    target: { files: [new File(["sample"], "resume.pdf", { type: "application/pdf" })] },
  });
  fireEvent.change(screen.getByLabelText(/Target role/), { target: { value: "Designer" } });
  fireEvent.click(screen.getByRole("button", { name: /Analyze CV/ }));

  await waitFor(() => expect(screen.getByText("Strong projects, but outcomes need detail.")).toBeTruthy());
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const requestBody = global.fetch.mock.calls[0][1].body;
  expect(requestBody.get("targetRole")).toBe("Designer");
  expect(screen.getByText("Show results")).toBeTruthy();

  fireEvent.click(screen.getByRole("tab", { name: "Action plan" }));
  fireEvent.click(screen.getByRole("button", { name: "Add a supported outcome" }));
  expect(screen.getByText("1 of 1 complete")).toBeTruthy();

  fireEvent.click(screen.getByRole("tab", { name: "Detailed review" }));
  expect(screen.getByText("Better wording")).toBeTruthy();
  expect(screen.getByText("React")).toBeTruthy();
});
