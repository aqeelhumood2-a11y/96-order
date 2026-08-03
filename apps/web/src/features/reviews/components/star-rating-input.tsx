/** A real radio group (fieldset + legend + labeled inputs), not clickable icons — keyboard-operable and each option has its own accessible name, per the spec's accessibility requirements for review stars. */
export function StarRatingInput({ value, onChange, disabled }: { value: number; onChange: (rating: number) => void; disabled?: boolean }) {
  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className="text-sm font-medium text-brand-950">Rating</legend>
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label key={rating} className="flex cursor-pointer items-center gap-1 text-sm text-foreground/80">
            <input type="radio" name="rating" value={rating} checked={value === rating} onChange={() => onChange(rating)} disabled={disabled} />
            {rating}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
