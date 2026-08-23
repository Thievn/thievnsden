export async function runPrintJob(jobId: string) {
  const started = Date.now();
  let last = "Printing… stay on this page.";
  while (Date.now() - started < 90000) {
    try {
      const run = await fetch("/api/afterimage/print/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const raw = await run.text();
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        last = "Still printing…";
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      if (run.ok && (data.prints?.length || data.image_url)) return data;
      if (data.rejected) throw new Error(data.error || "Couldn't print that.");
      if (data.error && !String(data.error).includes("FUNCTION_INVOCATION_TIMEOUT")) {
        last = data.error;
      }
    } catch (err: any) {
      if (String(err.message || "").includes("Couldn't print")) throw err;
      last = "Still printing…";
    }
    const st = await fetch(`/api/afterimage/job/${jobId}`).then((r) => r.json()).catch(() => ({}));
    if (st.status === "done") return st;
    if (st.status === "error") throw new Error(st.error || last);
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error(last || "Print timed out. Try again.");
}
