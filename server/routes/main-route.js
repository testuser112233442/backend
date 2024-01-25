const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.openAIKey });

const student = process.env.student;
const teacher = process.env.teacher; // PMBOK_Quiz

const runFinishedStates = [
  "completed",
  "failed",
  "cancelled",
  "expired",
  "requires_action",
];

class RunStatus {
  constructor(runId, threadId, status, requiredAction, lastError) {
    this.run_id = runId;
    this.thread_id = threadId;
    this.status = status;
    this.required_action = requiredAction;
    this.last_error = lastError;
  }
}

class ThreadMessage {
  constructor(content, role, hidden, id, created_at) {
    this.content = content;
    this.role = role;
    this.hidden = hidden;
    this.id = id;
    this.created_at = created_at;
  }
}

class Thread {
  constructor(messages) {
    this.messages = messages;
  }
}

class CreateMessage {
  constructor(content) {
    this.content = content;
  }
}

class GetUserRole {
  constructor(role) {
    this.role = role;
  }
}

router.post("/new", async (req, res) => {
  try {
    const message = req.body;
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      content:
        "Greet the user and tell it about yourself and ask it what it is looking for.",
      role: "user",
      metadata: { type: "hidden" },
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: message?.role === "student" ? student : teacher,
    });

    res.json(
      new RunStatus(
        run.id,
        thread.id,
        run.status,
        run.required_action,
        run.last_error
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/threads/:thread_id/runs/:run_id", async (req, res) => {
  try {
    const { thread_id, run_id } = req.params;
    const run = await openai.beta.threads.runs.retrieve(thread_id, run_id);

    res.json(
      new RunStatus(
        run.id,
        thread_id,
        run.status,
        run.required_action,
        run.last_error
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/threads/:thread_id/runs/:run_id/tool", async (req, res) => {
  try {
    const { thread_id, run_id } = req.params;
    const tool_outputs = req.body;

    const run = await openai.beta.threads.runs.submit_tool_outputs(
      thread_id,
      run_id,
      { tool_outputs }
    );

    res.json(
      new RunStatus(
        run.id,
        thread_id,
        run.status,
        run.required_action,
        run.last_error
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/threads/:thread_id", async (req, res) => {
  try {
    const { thread_id } = req.params;
    const messages = await openai.beta.threads.messages.list(thread_id);

    const result = messages.data.map(
      (message) =>
        new ThreadMessage(
          message.content[0].text.value,
          message.role,
          "type" in message.metadata && message.metadata.type === "hidden",
          message.id,
          message.created_at
        )
    );

    res.json(new Thread(result));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/threads/:thread_id", async (req, res) => {
  try {
    const { thread_id } = req.params;
    const { content, role } = req.body;

    await openai.beta.threads.messages.create(thread_id, {
      content: content,
      role: "user",
    });

    const run = await openai.beta.threads.runs.create(thread_id, {
      assistant_id: role === "student" ? student : teacher,
    });

    res.json(
      new RunStatus(
        run.id,
        thread_id,
        run.status,
        run.required_action,
        run.last_error
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
