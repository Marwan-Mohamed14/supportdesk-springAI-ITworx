import styled from 'styled-components';

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
`;

const InputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid ${({ $error, theme }) => ($error ? theme.colors.danger : theme.colors.inputBorder)};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.inputBg};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    padding: 10px 0;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textDark};
    background: transparent;
  }
`;

const TrailingButton = styled.button`
  appearance: none;
  background: none;
  border: none;
  padding: 4px;
  display: flex;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
`;

function FormField({
  label,
  labelRight,
  icon: Icon,
  trailingIcon: TrailingIcon,
  onTrailingClick,
  error,
  ...inputProps
}) {
  return (
    <Field>
      <LabelRow>
        <Label htmlFor={inputProps.id}>{label}</Label>
        {labelRight}
      </LabelRow>
      <InputWrap $error={Boolean(error)}>
        {Icon && <Icon size={16} />}
        <input {...inputProps} />
        {TrailingIcon && (
          <TrailingButton type="button" onClick={onTrailingClick} tabIndex={-1}>
            <TrailingIcon size={16} />
          </TrailingButton>
        )}
      </InputWrap>
      {error && <ErrorText>{error}</ErrorText>}
    </Field>
  );
}

export default FormField;
