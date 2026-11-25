# Agentic Automation Professional — ILT Workbook

A static HTML training workbook for the "Agentic Automation Professional" course. Participants build one Studio Web solution, `Insurance_Claim_Solution`, in a single module of 26 lessons:

| Section | Lessons |
| --- | --- |
| Claim Intake | Create the Insurance Claim Agent, system prompt, context grounding, tools, test with the sample claim pack, deploy, import the Claim App |
| Claim Approval Process | Import the BPMN file, start event, Fraud Detect Agent, download the claim file, supervisor validation, notify the claimant, reviewer gateway |
| Settlement Coded Agent | Create the coded agent in the solution, build it locally, test and push it, map it in Maestro |
| Decision and Deployment | Generate and send the decision email, debug and deploy the solution |

## Layout

- `index.html`, `work-environment.html` — home and environment setup
- `course/*.html` — the lessons
- `course/assets/` — screenshots and downloads (`Insurance_Claim_BPMN_Process.bpmn`, `ClaimInvoices_Sample.zip`, single claim PDFs in `claims/`)
- `assets/` — shared CSS, JS and fonts
- `tools/build.py` — regenerates the sidebar, lesson numbers, step numbers and Previous / Next links

## Editing lessons

Edit the body of a page in `course/`, then run:

```
python tools/build.py
```

To add, remove or reorder a lesson, change the `LESSONS` list in `tools/build.py` and run it again.

## Viewing locally

Open `index.html` in a browser, or run `python -m http.server` in this folder and open http://localhost:8000.

## Publishing on GitHub Pages

1. Push this folder to a GitHub repository (the `.nojekyll` file is included so Pages serves the site as-is).
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment → Source** choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. The site is published at `https://<username>.github.io/<repo-name>/` within a minute or two.
