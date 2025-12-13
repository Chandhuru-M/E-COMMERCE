import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import MetaData from "../layouts/MetaData";
import "./trackOrder.css";

const STEPS = [
  { key: "PLACED", label: "Order Placed" },
  { key: "CONFIRMED", label: "Order Confirmed" },
  { key: "SHIPPED", label: "Order Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function TrackOrder() {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTracking() {
      try {
        const { data } = await axios.get(`/api/v1/track/${id}`);
        setTracking(data.tracking);
      } catch (err) {
        alert("Failed to load tracking info");
      } finally {
        setLoading(false);
      }
    }

    fetchTracking();
  }, [id]);

  if (loading) return <h3 className="text-center mt-5">Loading tracking...</h3>;
  if (!tracking) return <h3 className="text-center mt-5">No tracking data</h3>;

  const STATUS_ORDER = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const currentIndex = STATUS_ORDER.indexOf(tracking.status);

const completedKeys = STATUS_ORDER.filter(
  (_, index) => index <= currentIndex
);

  return (
    <>
      <MetaData title="Track Order" />

      <div className="tracking-container">
        <h2 className="tracking-title">🚚 Order Tracking</h2>

        <p className="current-status">
          Current Status: <span>{tracking.status}</span>
        </p>

        <div className="timeline">
          {STEPS.map((step, index) => {
            const completed = completedKeys.includes(step.key);
            const isLast = index === STEPS.length - 1;

            return (
              <div className="timeline-step" key={step.key}>
                <div className="timeline-left">
                  <div
                    className={`dot ${completed ? "completed" : ""}`}
                  ></div>
                  {!isLast && (
                    <div
                      className={`line ${completed ? "completed" : ""}`}
                    ></div>
                  )}
                </div>

                <div className="timeline-content">
                  <h4>{step.label}</h4>
                  <p>{completed ? "Completed" : "Pending"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
