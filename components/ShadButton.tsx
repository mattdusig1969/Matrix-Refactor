import { Button } from "@/components/ui/button";

export default function ShadButton({ label }: { label: string }) {
  return (
    <Button variant="default" className="w-full">
      {label}
    </Button>
  );
}
