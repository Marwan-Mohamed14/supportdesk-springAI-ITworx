import { Lock, ShieldCheck, Sparkles } from 'lucide-react';
import styled from 'styled-components';
import logo from '../../assets/logo.svg';

const Screen = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 42%) 1fr;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  background: linear-gradient(180deg, ${({ theme }) => theme.colors.panelDark} 0%, ${({ theme }) => theme.colors.panelDarkAlt} 100%);
  color: ${({ theme }) => theme.colors.textOnDark};
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: 900px) {
    display: none;
  }
`;

const LogoBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-left: -10px;
`;

const LogoImage = styled.img`
  display: block;
  height: 44px;
  width: auto;
`;

const LogoUnderline = styled.div`
  display: flex;
  gap: 4px;

  span {
    height: 3px;
    width: 28px;
    border-radius: 2px;
  }

  span:first-child {
    background: ${({ theme }) => theme.colors.mark};
  }

  span:last-child {
    background: ${({ theme }) => theme.colors.accent};
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 440px;
`;

const Headline = styled.h1`
  margin: 0;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 800;
`;

const HeadlineMuted = styled.span`
  color: ${({ theme }) => theme.colors.textOnDarkMuted};
`;

const FeatureList = styled.ul`
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textOnDarkMuted};

  svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: ${({ theme }) => theme.colors.mark};
  }
`;

const Footer = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textOnDarkMuted};
`;

const RightPanel = styled.div`
  background: ${({ theme }) => theme.colors.panelLight};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FEATURES = [
  { icon: Sparkles, text: 'AI suggested replies grounded in your knowledge base' },
  { icon: ShieldCheck, text: 'Role-based tool access — refunds need admin approval' },
  { icon: Lock, text: 'Every assistant action written to the audit trail' },
];

function AuthLayout({ children }) {
  const year = new Date().getFullYear();

  return (
    <Screen>
      <LeftPanel>
        <LogoBlock>
          <LogoImage src={logo} alt="ITWORX" />
          <LogoUnderline>
            <span />
            <span />
          </LogoUnderline>
        </LogoBlock>

        <Content>
          <Headline>
            SupportDesk AI
            <br />
            <HeadlineMuted>Ticketing, grounded answers, safe tool actions.</HeadlineMuted>
          </Headline>
          <FeatureList>
            {FEATURES.map(({ icon: Icon, text }) => (
              <FeatureItem key={text}>
                <Icon size={16} />
                <span>{text}</span>
              </FeatureItem>
            ))}
          </FeatureList>
        </Content>

        <Footer>&copy; {year} ITWorx. Internal support platform concept.</Footer>
      </LeftPanel>

      <RightPanel>
        <Card>{children}</Card>
      </RightPanel>
    </Screen>
  );
}

export default AuthLayout;
