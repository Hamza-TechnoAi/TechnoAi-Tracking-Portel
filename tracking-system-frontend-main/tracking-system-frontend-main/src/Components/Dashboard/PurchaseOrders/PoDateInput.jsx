import { useEffect, useId, useRef, useState } from 'react';
import { MdCalendarMonth } from 'react-icons/md';
import { formatPoDate, parsePoDateInput, toDateInputValue } from '../../../Utils/formatters';
import './PoDateInput.scss';

export default function PoDateInput({
  id,
  value,
  onChange,
  error,
  placeholder = 'DD-Mon-YYYY',
  className = 'po-management__input',
  disabled = false,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const pickerId = `${inputId}-picker`;
  const pickerRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(() => (
    value ? formatPoDate(value) : ''
  ));

  useEffect(() => {
    setDisplayValue(value ? formatPoDate(value) : '');
  }, [value]);

  const handleChange = (event) => {
    setDisplayValue(event.target.value);
  };

  const handleBlur = () => {
    if (!displayValue.trim()) {
      onChange('');
      return;
    }

    const parsed = parsePoDateInput(displayValue);

    if (!parsed) {
      onChange(value || '');
      setDisplayValue(value ? formatPoDate(value) : '');
      return;
    }

    onChange(parsed);
    setDisplayValue(formatPoDate(parsed));
  };

  const handlePickerChange = (event) => {
    const nextValue = event.target.value;
    onChange(nextValue);
    setDisplayValue(nextValue ? formatPoDate(nextValue) : '');
  };

  const openCalendar = () => {
    const picker = pickerRef.current;
    if (!picker || disabled) return;

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    picker.focus();
    picker.click();
  };

  return (
    <div className="po-date-input">
      <div className="po-date-input__control">
        <input
          id={inputId}
          type="text"
          className={className}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
        />
        <button
          type="button"
          className="po-date-input__calendar-btn"
          onClick={openCalendar}
          disabled={disabled}
          aria-label="Open calendar"
          title="Open calendar"
        >
          <MdCalendarMonth size={18} aria-hidden />
        </button>
        <input
          ref={pickerRef}
          id={pickerId}
          type="date"
          className="po-date-input__native-picker"
          value={toDateInputValue(value)}
          onChange={handlePickerChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
        />
      </div>
      {error && <p className="po-management__error">{error}</p>}
    </div>
  );
}
