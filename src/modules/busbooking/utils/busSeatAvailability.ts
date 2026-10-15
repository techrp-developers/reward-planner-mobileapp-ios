const normalizeSeatStatus = (value: unknown): unknown =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export const isSeatAvailable = (value: unknown): boolean => {
  const status = normalizeSeatStatus(value);
  return status === true || status === "true" || status === 1 || status === "1";
};

// An empty or malformed layout cannot establish that a bus is sold out.
export const getVerifiedAvailableSeats = (seats: unknown): number | null => {
  if (!Array.isArray(seats) || seats.length === 0) return null;
  const valid = seats.every(seat => {
    if (!seat || typeof seat !== "object" || !String(seat.SeatName ?? "").trim()) return false;
    return [true, false, 1, 0, "true", "false", "1", "0"].includes(normalizeSeatStatus(seat.SeatStatus) as any);
  });
  return valid ? countAvailableSeats(seats) : null;
};

export const countAvailableSeats = (seats: { SeatStatus: unknown }[]): number =>
  seats.filter(seat => isSeatAvailable(seat.SeatStatus)).length;

export const formatAvailableSeats = (value: unknown): string => {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d+)(?:\.0+)?(?:\s+SEATS?(?:\s+LEFT|\s+AVAILABLE)?)?$/i);
  return match ? `${Number(match[1])} SEATS LEFT` : "CHECK AVAILABILITY";
};
