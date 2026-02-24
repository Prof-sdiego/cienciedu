import { useState } from "react";
import { Check, Delete } from "lucide-react";

interface NumericKeypadProps {
  onSubmit: (pin: string) => void;
  loading?: boolean;
  error?: string;
}

const NumericKeypad = ({ onSubmit, loading, error }: NumericKeypadProps) => {
  const [pin, setPin] = useState("");

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        onSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      onSubmit(pin);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4">
      {/* PIN Display */}
      <div className="flex gap-4 mb-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl border-4 flex items-center justify-center text-4xl sm:text-5xl font-display font-bold transition-all duration-200 ${
              pin[i]
                ? "border-primary bg-primary/10 text-primary animate-bounce-in"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {pin[i] ? "●" : ""}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-destructive text-lg font-display font-bold animate-bounce-in">{error}</p>
      )}

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {digits.map(digit => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={loading}
            className="touch-target-xxl rounded-2xl bg-card shadow-md border-2 border-border text-3xl sm:text-4xl font-display font-bold text-foreground hover:bg-secondary active:scale-95 transition-all duration-150 flex items-center justify-center aspect-square"
          >
            {digit}
          </button>
        ))}
        {/* Bottom row: delete, 0, enter */}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="touch-target-xxl rounded-2xl bg-card shadow-md border-2 border-border text-2xl text-muted-foreground hover:bg-secondary active:scale-95 transition-all duration-150 flex items-center justify-center aspect-square"
        >
          <Delete className="w-8 h-8" />
        </button>
        <button
          onClick={() => handleDigit("0")}
          disabled={loading}
          className="touch-target-xxl rounded-2xl bg-card shadow-md border-2 border-border text-3xl sm:text-4xl font-display font-bold text-foreground hover:bg-secondary active:scale-95 transition-all duration-150 flex items-center justify-center aspect-square"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={pin.length < 4 || loading}
          className={`touch-target-xxl rounded-2xl shadow-lg border-2 text-2xl font-bold transition-all duration-150 flex items-center justify-center aspect-square ${
            pin.length === 4
              ? "bg-success border-success text-success-foreground hover:opacity-90 active:scale-95 animate-pulse-soft"
              : "bg-muted border-border text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Check className="w-10 h-10" />
        </button>
      </div>
    </div>
  );
};

export default NumericKeypad;
