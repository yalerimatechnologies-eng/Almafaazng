"use client";

import { useEffect, useState } from "react";

function getTime() {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

function getDate() {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function LiveClock() {
  const [time, setTime] = useState("--:--:--");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(getTime());
      setDate(getDate());
    };

    update();
    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="live-clock" aria-label="Live West Africa time">
      <div className="clock-indicator" />
      <div className="clock-copy">
        <span className="clock-label">NIGERIA · WAT</span>
        <strong className="clock-time">{time}</strong>
        <span className="clock-date">{date}</span>
      </div>
    </div>
  );
}
