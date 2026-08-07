import styled from 'styled-components';

export const Heading = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
`;

export const Subheading = styled.p`
  margin: 6px 0 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const InlineLink = styled.a`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  input {
    width: 15px;
    height: 15px;
    accent-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const PrimaryButton = styled.button`
  appearance: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 11px;
  letter-spacing: 0.04em;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.cardBorder};
  }
`;

export const GhostButton = styled.button`
  appearance: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 11px 0;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textDark};
  background: ${({ theme }) => theme.colors.inputBg};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.panelLight};
  }
`;

export const FooterText = styled.p`
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const FormError = styled.div`
  margin: 0;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.danger}1a;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 13px;
`;
