import { Loader } from "@/components/app/ui";

export default function Loading() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
    }}>
      <Loader size={64} label="Loading" />
    </div>
  );
}
