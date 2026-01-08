import { useState, useEffect } from "react";
import { Clock, Lock, Unlock } from "lucide-react";

interface RegistrationCountdownProps {
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  tournamentStartAt?: string | null;
}

type RegistrationStatus = "not_opened" | "open" | "closed";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const RegistrationCountdown = ({
  registrationOpenAt,
  registrationCloseAt,
  tournamentStartAt,
}: RegistrationCountdownProps) => {
  const [status, setStatus] = useState<RegistrationStatus>("open");
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);

  useEffect(() => {
    const calculateStatus = () => {
      const now = new Date();
      const openDate = registrationOpenAt ? new Date(registrationOpenAt) : null;
      const closeDate = registrationCloseAt ? new Date(registrationCloseAt) : null;

      // If no dates are set, registration is always open
      if (!openDate && !closeDate) {
        setStatus("open");
        setTimeRemaining(null);
        setTargetDate(null);
        return;
      }

      // Check if registration hasn't opened yet
      if (openDate && now < openDate) {
        setStatus("not_opened");
        setTargetDate(openDate);
        return;
      }

      // Check if registration is closed
      if (closeDate && now > closeDate) {
        setStatus("closed");
        setTimeRemaining(null);
        setTargetDate(null);
        return;
      }

      // Registration is open
      setStatus("open");
      setTargetDate(closeDate);
    };

    calculateStatus();
    const interval = setInterval(calculateStatus, 1000);
    return () => clearInterval(interval);
  }, [registrationOpenAt, registrationCloseAt]);

  useEffect(() => {
    if (!targetDate) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const formatTime = (time: TimeRemaining) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (time.days > 0) {
      return `${time.days}d ${pad(time.hours)}h ${pad(time.minutes)}m ${pad(time.seconds)}s`;
    }
    return `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`;
  };

  if (status === "closed") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
        <Lock className="w-5 h-5 text-destructive" />
        <span className="font-bold text-destructive">Registration Closed</span>
      </div>
    );
  }

  if (status === "not_opened" && timeRemaining) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 px-4 py-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
          <span className="font-medium text-amber-500">Registration opens in:</span>
        </div>
        <div className="font-mono text-xl font-bold text-amber-500 tabular-nums">
          {formatTime(timeRemaining)}
        </div>
      </div>
    );
  }

  if (status === "open" && timeRemaining) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 px-4 py-3 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Unlock className="w-5 h-5 text-green-500" />
          <span className="font-medium text-green-500">Registration closes in:</span>
        </div>
        <div className="font-mono text-xl font-bold text-green-500 tabular-nums">
          {formatTime(timeRemaining)}
        </div>
      </div>
    );
  }

  // Registration is open with no close date
  if (status === "open") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
        <Unlock className="w-5 h-5 text-green-500" />
        <span className="font-bold text-green-500">Registration Open</span>
      </div>
    );
  }

  return null;
};

export const getRegistrationStatus = (
  registrationOpenAt: string | null,
  registrationCloseAt: string | null
): RegistrationStatus => {
  const now = new Date();
  const openDate = registrationOpenAt ? new Date(registrationOpenAt) : null;
  const closeDate = registrationCloseAt ? new Date(registrationCloseAt) : null;

  if (!openDate && !closeDate) {
    return "open";
  }

  if (openDate && now < openDate) {
    return "not_opened";
  }

  if (closeDate && now > closeDate) {
    return "closed";
  }

  return "open";
};

export const canRegister = (
  registrationOpenAt: string | null,
  registrationCloseAt: string | null
): boolean => {
  return getRegistrationStatus(registrationOpenAt, registrationCloseAt) === "open";
};