export function Checkbox({label, onChange, checked, title, id, inputId, backwards=false}){
    const lab = <label htmlFor={label}>{label}</label>

    return <span className="checkbox" id={id} title={title}>
        {backwards && lab}
        <input
            type="checkbox"
            name={label}
            id={inputId}
            onChange={(e) => onChange(e.target.value === 'on')}
            checked={checked}
        ></input>
        {!backwards && lab}
    </span>
}

export function Input({label, onChange, type, value, inputProps, title, id, inputId, backwards=false}){
    const lab = <label htmlFor={label}>{label}</label>

    return <span className="checkbox" id={id} title={title}>
        {!backwards && lab}
        <input
            type={type}
            name={label}
            id={inputId}
            value={value}
            onChange={onChange}
            {...inputProps}
        ></input>
        {backwards && lab}
    </span>
}
