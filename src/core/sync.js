import { exportJson } from "./storage.js";

export function isEmptyState(s) {
  return s.decks.length === 0 && Object.keys(s.notes).length === 0 && !s.favorites?.length;
}

// ログインした直後に、端末とクラウドのどちらのデータを使うか
export function decideOnSignIn(local, remote) {
  if (!remote) return "upload";
  if (isEmptyState(local)) return "download";
  if (exportJson(local) === exportJson(remote)) return "same";
  return "ask";
}

// ページに戻ったとき（開いたときも同じ）に、クラウドとどうやり取りするか。時刻はミリ秒
export function decideOnResume(dirty, remoteUpdatedAt, lastPulledAt) {
  if (dirty) return "push";
  if (remoteUpdatedAt !== null && remoteUpdatedAt > lastPulledAt) return "pull";
  return "none";
}

// クラウドへの書き込みを、前回の書き込みから interval ミリ秒に1回までにまとめる。
// write はその時点の最新の state を書く。失敗したら dirty を残し、次の schedule か flush で書き直す
export function createScheduler({ write, now, setTimer, clearTimer, interval = 30000 }) {
  let lastWrite = -Infinity;
  let timer = null;
  let running = null;
  let flushAfter = false;
  const s = { dirty: false };

  const run = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
    s.dirty = false;
    lastWrite = now();
    running = new Promise((resolve) => resolve(write()))
      .catch(() => {
        s.dirty = true;
      })
      .then(() => {
        running = null;
        if (!s.dirty) return;
        if (flushAfter) {
          flushAfter = false;
          return run();
        }
        arm();
      });
    return running;
  };

  const arm = () => {
    if (timer !== null || running) return;
    const wait = lastWrite + interval - now();
    if (wait <= 0) {
      run();
      return;
    }
    timer = setTimer(() => {
      timer = null;
      if (s.dirty) run();
    }, wait);
  };

  s.schedule = () => {
    s.dirty = true;
    arm();
  };

  s.flush = () => {
    if (running) {
      if (s.dirty) flushAfter = true;
      return running;
    }
    return s.dirty ? run() : Promise.resolve();
  };

  return s;
}
