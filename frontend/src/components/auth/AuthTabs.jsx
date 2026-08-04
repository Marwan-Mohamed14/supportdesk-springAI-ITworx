import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const TabWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  background: ${({ theme }) => theme.colors.cardBorder};
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Tab = styled.button`
  appearance: none;
  border: none;
  padding: 9px 0;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $active, theme }) => ($active ? theme.colors.inputBg : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.textDark : theme.colors.textMuted)};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadow.card : 'none')};
  transition: background 0.15s ease, color 0.15s ease;
`;

function AuthTabs({ active }) {
  const navigate = useNavigate();

  return (
    <TabWrap role="tablist" aria-label="Authentication">
      <Tab
        type="button"
        role="tab"
        aria-selected={active === 'login'}
        $active={active === 'login'}
        onClick={() => navigate('/login')}
      >
        Log in
      </Tab>
      <Tab
        type="button"
        role="tab"
        aria-selected={active === 'signup'}
        $active={active === 'signup'}
        onClick={() => navigate('/signup')}
      >
        Sign up
      </Tab>
    </TabWrap>
  );
}

export default AuthTabs;
