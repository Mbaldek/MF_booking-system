export default function MfCheckbox({ checked, onChange, size = 26 }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      className={`flex-shrink-0 rounded-[6px] flex items-center justify-center cursor-pointer transition-all duration-150 border-2 ${
        checked
          ? 'bg-mf-rose border-mf-rose text-white'
          : 'bg-white border-mf-border'
      }`}
    >
      {checked && <span>&#10003;</span>}
    </button>
  );
}
