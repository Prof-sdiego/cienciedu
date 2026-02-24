interface ImageOptionProps {
  imageUrl: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const ImageOption = ({ imageUrl, selected, onSelect, disabled }: ImageOptionProps) => {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`relative rounded-2xl overflow-hidden shadow-lg transition-all duration-200 active:scale-95 ${
        selected
          ? "ring-[6px] ring-primary scale-105 shadow-2xl"
          : "ring-2 ring-border hover:ring-4 hover:ring-primary/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <img
        src={imageUrl}
        alt="Opção"
        className="w-full h-full object-cover aspect-square"
        draggable={false}
      />
    </button>
  );
};

export default ImageOption;
