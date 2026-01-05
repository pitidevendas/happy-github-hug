import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PGVEditableCellProps {
  value: number;
  onSave: (value: number) => void;
  isLoading?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

const PGVEditableCell = ({
  value,
  onSave,
  isLoading = false,
  formatValue,
  className,
}: PGVEditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = parseFloat(editValue) || 0;
    if (numValue !== value) {
      onSave(numValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  const displayValue = formatValue ? formatValue(value) : value.toLocaleString('pt-BR');

  if (isEditing) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn("w-24 h-8 text-right text-sm", className)}
        />
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setIsEditing(true)}
      className={cn(
        "relative px-2 py-1 rounded-md transition-colors cursor-pointer text-right min-w-[80px]",
        "hover:bg-primary/10 hover:ring-1 hover:ring-primary/30",
        className
      )}
    >
      <span className="font-medium">{displayValue}</span>
      
      {isLoading && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -right-5 top-1/2 -translate-y-1/2"
        >
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </motion.span>
      )}
      
      {showSuccess && !isLoading && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute -right-5 top-1/2 -translate-y-1/2"
        >
          <Check className="h-3 w-3 text-emerald-500" />
        </motion.span>
      )}
    </motion.button>
  );
};

export default PGVEditableCell;
