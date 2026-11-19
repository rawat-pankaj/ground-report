"use client";

import { useEffect, useState } from "react";

// "Thu, 19 Nov 2026" in India time, filled in by the browser. The homepage is a
// ready-made (static) page that is only rebuilt after an admin change, so a date
// rendered on the server would go stale. Empty until it mounts (a split second).
export default function TodayDate(props) {
  const [today, setToday] = useState("");

  useEffect(() => {
    // Assembled from parts because en-IN puts an extra comma after the month
    // ("Thu, 19 Nov, 2026").
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
        .formatToParts(new Date())
        .map((p) => [p.type, p.value])
    );
    setToday(`${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`);
  }, []);

  return <p {...props}>{today}</p>;
}
