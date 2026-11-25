"""Regenerate the shared chrome of every handbook page.

Run from the repo root:  python tools/build.py

For each page it rewrites the sidebar (one module, lessons in build order),
the "Lesson N of M" eyebrow, the Previous / Next footer and the step numbers,
so lessons can be reordered or added by editing LESSONS below.
Page bodies are left untouched.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COURSE = "Insurance Claim Solution"

# (file in course/, sidebar label, section)
LESSONS = [
    ("concepts-conversational.html", "Conversational Agent Concepts", "Claim Intake"),
    ("create-claim-agent.html", "Create the Insurance Claim Agent", "Claim Intake"),
    ("system-prompt.html", "System Prompt", "Claim Intake"),
    ("context-grounding.html", "Context Grounding", "Claim Intake"),
    ("tools.html", "Tools", "Claim Intake"),
    ("test-claim-agent.html", "Test the Insurance Claim Agent", "Claim Intake"),
    ("deploy-agent.html", "Deploy and Get Agent ID", "Claim Intake"),
    ("import-claim-app.html", "Import the Claim App", "Claim Intake"),
    ("observe-agent.html", "Observe Your Agent", "Claim Intake"),
    ("concepts-maestro.html", "Maestro BPMN Concepts", "Claim Approval Process"),
    ("import-bpmn.html", "Import the BPMN File", "Claim Approval Process"),
    ("start-event.html", "Start Event", "Claim Approval Process"),
    ("fraud-agent-build.html", "Build the Fraud Detect Agent", "Claim Approval Process"),
    ("fraud-agent-evaluate.html", "Test and Evaluate the Fraud Agent", "Claim Approval Process"),
    ("fraud-agent-task.html", "Fraud Detection Agent Task", "Claim Approval Process"),
    ("download-claim-file.html", "Download the Claim File", "Claim Approval Process"),
    ("supervisor-validation.html", "Supervisor Validation", "Claim Approval Process"),
    ("notify-claimant.html", "Notify the Claimant", "Claim Approval Process"),
    ("reviewer-gateway.html", "Reviewer Gateway", "Claim Approval Process"),
    ("coded-agent-create.html", "Create the Settlement Coded Agent", "Settlement Coded Agent"),
    ("coded-agent-build.html", "Build the Coded Agent Locally", "Settlement Coded Agent"),
    ("coded-agent-test-push.html", "Test and Push the Coded Agent", "Settlement Coded Agent"),
    ("coded-agent-task.html", "Settlement Coded Agent Task", "Settlement Coded Agent"),
    ("generate-email.html", "Generate the Decision Email", "Decision and Deployment"),
    ("send-email.html", "Send the Decision Email", "Decision and Deployment"),
    ("debug-deploy.html", "Debug and Deploy the Solution", "Decision and Deployment"),
    ("complete.html", "Course Complete", "Decision and Deployment"),
]
ROOT_PAGES = [("index.html", "Home"), ("work-environment.html", "Work Environment")]


def sidebar(prefix, active):
    out = ['<div class="nav">',
           '  <div class="rise-course-block">',
           f'    <p class="rise-course-title">{COURSE}</p>',
           '    <div class="rise-progress"><div class="rise-progress-bar"><div class="rise-progress-fill" style="width:0%"></div></div><span class="rise-progress-label">0% COMPLETE</span></div>',
           '  </div>']
    up = "" if prefix == "course/" else "../"
    for f, label in ROOT_PAGES:
        cls = "rise-home active" if active == f else "rise-home"
        out.append(f'  <a class="{cls}" href="{up}{f}">{label}</a>')
    out.append('  <details open>')
    out.append(f'    <summary>{COURSE}</summary>')
    out.append('    <div class="group-items">')
    section = None
    for i, (f, label, sec) in enumerate(LESSONS, 1):
        if sec != section:
            section = sec
            out.append(f'      <div class="nav-section">{sec}</div>')
        cls = "lesson-row active" if active == f else "lesson-row"
        out.append(f'      <a class="{cls}" href="{prefix}{f}"><span class="lesson-ico">{i}</span>'
                   f'<span class="lesson-label">{label}</span><span class="lesson-status" aria-hidden="true"></span></a>')
    out += ['    </div>', '  </details>', '</div>']
    return "\n".join(out)


NAV_RE = re.compile(r'(<nav class="md-sidebar md-sidebar--primary">)\s*<div class="nav">.*?</details>\s*</div>\s*(</nav>)', re.S)
FOOT_RE = re.compile(r'<nav class="md-footer-nav">.*?</nav>', re.S)


def footer(prev, nxt):
    parts = ['<nav class="md-footer-nav">']
    if prev:
        parts.append(f'      <a class="prev" href="{prev[0]}"><span class="dir">← Previous</span><span class="ttl">{prev[1]}</span></a>')
    if nxt:
        parts.append(f'      <a class="next" href="{nxt[0]}"><span class="dir">Next →</span><span class="ttl">{nxt[1]}</span></a>')
    parts.append('    </nav>')
    return "\n".join(parts)


def write(path, html):
    path.write_text(html, encoding="utf-8", newline="\n")


def main():
    step = 0
    total = len(LESSONS) - 1  # the completion page is not counted
    for i, (f, label, sec) in enumerate(LESSONS):
        p = ROOT / "course" / f
        html = p.read_text(encoding="utf-8")
        html = NAV_RE.sub(lambda m: m.group(1) + "\n" + sidebar("", f) + "\n  " + m.group(2), html)
        eyebrow = f"{sec} · Lesson {i + 1} of {total}" if f != "complete.html" else f"{COURSE} · Complete"
        html = re.sub(r'<span class="eyebrow">[^<]*</span>', f'<span class="eyebrow">{eyebrow}</span>', html, count=1)
        html = re.sub(r'<title>[^<]*</title>', f'<title>{label} · {COURSE}</title>', html, count=1)
        html = re.sub(r'<h1>[^<]*</h1>', f'<h1>{label}</h1>', html, count=1)
        prev = (LESSONS[i - 1][0], LESSONS[i - 1][1]) if i else ("../work-environment.html", "Work Environment")
        nxt = (LESSONS[i + 1][0], LESSONS[i + 1][1]) if i + 1 < len(LESSONS) else ("../index.html", "Home")
        html = FOOT_RE.sub(footer(prev, nxt), html, count=1)

        def renum(m):
            nonlocal step
            step += 1
            return f'<div class="step" id="step-{step}">\n      <div class="num">{step}</div>'
        html = re.sub(r'<div class="step" id="step-[^"]*">\s*<div class="num">\d+</div>', renum, html)
        write(p, html)

    first = LESSONS[0]
    for f, label in ROOT_PAGES:
        p = ROOT / f
        html = p.read_text(encoding="utf-8")
        html = NAV_RE.sub(lambda m: m.group(1) + "\n" + sidebar("course/", f) + "\n  " + m.group(2), html)
        if f == "index.html":
            html = FOOT_RE.sub(footer(None, ("work-environment.html", "Work Environment")), html, count=1)
        else:
            html = FOOT_RE.sub(footer(("index.html", "Home"), ("course/" + first[0], first[1])), html, count=1)
        write(p, html)
    print(f"Built {len(LESSONS)} lessons, {step} steps.")


if __name__ == "__main__":
    main()
