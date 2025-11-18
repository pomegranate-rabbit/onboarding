# Onboarding Guide

Thank you for your interest in our study. This guide walks you through all of the required setup steps so that you're fully ready to participate in the main study.

As you work through this onboarding guide, please update your completion status using [this form](https://forms.gle/SLXdJk3SbjHCYnpd9).

## 1) Create an Anonymous GitHub Account

To keep your work fully anonymous, please create a separate GitHub account for this study. Because part of our research focuses on how developers collaborate, things like your existing commit history or GitHub profile could unintentionally influence how others view your work. Setting up a new account will help us make sure that all contributions are evaluated on their content and not the contributor’s identity.

You can make your account in any way that works for you, but here’s a simple method that we’ve found works well:

- Visit a disposable email provider (e.g., generator.email) and create a temporary email.
- Sign up at https://github.com/signup with that email.
- Choose a non-identifying username in the format `{favorite_fruit}-{favorite_animal}` (example: `mango-otter`).
- Do not include personal details (name, photo, location) and use this account only for study-related work.

> Once you're finished, update your [status](https://forms.gle/SLXdJk3SbjHCYnpd9) and continue onto the the next step.

## 2) Install AI Coding Tools

You’ll use both Cursor and Claude Code during the study. For each tool, we provide (1) a setup guide for installation and configuration, and (2) a quickstart based on the official documentation that introduces key features and functionality.

> **Important:** You have an API credit of **$20 total** for this study, shared across both Cursor and Claude Code. **Please use this budget thoughtfully**—keep in mind that usage in either tool will count toward the same limit.

### Cursor

To set up Cursor, follow the instructions provided [here](https://docs.google.com/document/d/1kcVAi28N4hAu_FuuRBffViv0rwcA2tny7jCBvH-0zyI/edit?tab=t.2197x7mt33ut). These instructions are also available as `cursor_setup.pdf` in the `/tools/cursor` directory. If you already have a Cursor Pro subscription, you can add the Anthropic API key we’ve given you to the model settings. If you are new to Cursor, please download the free version that includes the Pro free trial. Once your trial ends, upgrade to Cursor Pro and we will reimburse you for the cost.

- Download: https://cursor.com/downloads
- Quickstart: `tools/cursor/cursor_onboarding.md`
- Setup reference: `tools/cursor/cursor_setup.pdf`

### Claude Code (CLI)

To set up Claude Code, follow the instructions provided [here](https://docs.google.com/document/d/1kcVAi28N4hAu_FuuRBffViv0rwcA2tny7jCBvH-0zyI/edit?tab=t.qzr812mtrcha). You can also find these instructions as `claude_setup.pdf` in the `/tools/claude_code folder`. We will provide you with an Anthropic API key via email. **For your assigned project, you will need to replicate these steps to set up the local Claude configuration**

- Download (Homebrew): `brew install --cask claude-code`
- Quickstart: `tools/claude_code/claude_onboarding.md`
- Setup reference: `tools/claude_code/claude_setup.pdf`

> Reminder to update your [status](https://forms.gle/SLXdJk3SbjHCYnpd9) once you have completed this step.

## 3) Set Up Screen Recording Tool

For this study, we’ll be using a custom screen recorder to capture your coding sessions. The tool helps you choose exactly which windows you’re comfortable sharing and records only high-signal activity related to your interactions.

### Installation

Please install and run the recorder from the following repository:
https://github.com/jennjwang/swe-prod-recorder

A visual walkthrough for the setup process is available [here](https://docs.google.com/document/d/1kcVAi28N4hAu_FuuRBffViv0rwcA2tny7jCBvH-0zyI/edit?tab=t.r88ylnapzh5a#heading=h.lmf23ws57a4n)

### Storage Options

Because screen recordings can take up a lot of storage (~300 mb per hour), we provide the option for your to upload recordings directly to your Google Drive. You can find the setup instructions [here](https://docs.google.com/document/d/1kcVAi28N4hAu_FuuRBffViv0rwcA2tny7jCBvH-0zyI/edit?tab=t.cqbysjja5sff).

> Reminder to update your [completion status](https://forms.gle/SLXdJk3SbjHCYnpd9) once you have completed this step.

## 4) Install AI Usage Logger (SpecStory)

We’ll also be tracking your AI usage as part of this study. [SpecStory](https://specstory.com/) is a Cursor extension and CLI tool that automatically records your AI-assisted coding activity as local Markdown files.

We use a lightly modified version of the original SpecStory tool that also records timestamps for your AI interactions. These logs help us understand how you interact with AI during development workflows.

### Installation

Install both components following the SpecStory installation guide ([Google Doc](https://docs.google.com/document/d/1kcVAi28N4hAu_FuuRBffViv0rwcA2tny7jCBvH-0zyI/edit?tab=t.1tnketgq1kv3) or `tools/specstory/specstory_installation.pdf`):

- **CLI tool** (for terminal workflows): `tools/specstory/specstory_cli/`
- **Editor extension** (Cursor/VS Code): `tools/specstory/specstory_ext/`

### Verification

Verify that SpecStory is logging correctly by running a short AI interaction and then checking the .specstory/history/ folder for a newly created Markdown file. Open the file to confirm that it contains the recent requests and responses from your interaction.

> Reminder to update your [status](https://forms.gle/SLXdJk3SbjHCYnpd9) once you have completed this step.

## 5) Practice Tasks

We’ve set up a small project in `playground` that provides a more detailed guided tour of both Claude Code and Cursor. The project is a simple unit-conversion toolkit (temperature, distance, weight) with a CLI, dispatcher, and test suite designed specifically for experimentation.

### Setup

Start by forking this repository using your anonymous GitHub account and cloning your fork locally. While working in this project, please keep both the screen recorder and SpecStory running at all times.

### Commit Guide

Please use AI freely throughout the tasks; however, because reviewers are blinded to AI usage, your code and commit messages should not include any explicit indicators of AI usage. Examples of **AI usage signals** include:

- Direct references to tools (e.g., “generated by Cursor,” “Claude wrote this,” “AI suggestion”)
- Boilerplate phrases like “As an AI assistant, I…”
- Tags or markers such as `[AI]`, `[Cursor]`, `[Claude]`

Git hooks will catch common markers, but please double-check your changes before committing.

### Completion

Once you have completed the practice tasks, please submit the [onboarding form] (https://forms.gle/SLXdJk3SbjHCYnpd9) with the following artifacts:

- A zipped copy of your `.specstory folder` from this repo
- A zipped copy of the `/data` folder from your screen recorder directory
- A link to your forked repository with all changes committed and pushed.

Once we receive your submission, we’ll know you’re ready for the main study and follow up with next steps. Thank you for your participation!
