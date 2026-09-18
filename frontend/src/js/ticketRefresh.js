import { useEffect } from "react";

export function useTicketRefresh(refresh) {
  useEffect(() => {
    const onChange = () => refresh(true);
    window.addEventListener("ticketly:tickets-changed", onChange);
    const interval = window.setInterval(onChange, 5000);
    return () => {
      window.removeEventListener("ticketly:tickets-changed", onChange);
      window.clearInterval(interval);
    };
  }, [refresh]);
}
