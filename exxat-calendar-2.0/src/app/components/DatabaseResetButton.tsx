import { FontAwesomeIcon } from "./font-awesome-icon";
import { Button } from "./ui/button";
import { useState } from "react";

export function DatabaseResetButton() {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    // Simulate database reset
    setTimeout(() => {
      setIsResetting(false);
      console.log("Database reset complete");
    }, 1000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      disabled={isResetting}
      className="w-full font-['Roboto']"
    >
      {isResetting ? (
        <FontAwesomeIcon name="spinner" spin className="w-4 h-4 mr-2" />
      ) : (
        <FontAwesomeIcon name="database" className="w-4 h-4 mr-2" />
      )}
      {isResetting ? "Resetting..." : "Reset Database"}
    </Button>
  );
}