import { Link } from 'react-router-dom';

type DirectoryDestination = 'browse' | 'leaderboard' | 'discord' | 'admin' | 'home';

const directoryItems: Array<{
  id: DirectoryDestination;
  label: string;
  to: string;
  external?: boolean;
}> = [
  { id: 'browse', label: 'Browse Theories', to: '/theories' },
  { id: 'leaderboard', label: 'Leaderboard', to: '/leaderboard' },
  { id: 'discord', label: 'Join Our Discord', to: 'https://discord.gg/jr8knWMMTb', external: true },
  { id: 'admin', label: 'Admin Portal', to: '/admin' },
  { id: 'home', label: 'Home', to: '/' },
];

type DirectoryLinksProps = {
  active?: DirectoryDestination;
};

function DirectoryLinks({ active }: DirectoryLinksProps) {
  return (
    <div className="directory-section">
      <h2 className="directory-title">DIRECTORY</h2>
      <ul className="directory-list">
        {directoryItems.map((item) => {
          const content =
            item.external ? (
              <a href={item.to} style={{ color: '#dc2626', textDecoration: 'none' }} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <Link to={item.to} style={{ color: '#dc2626', textDecoration: 'none' }}>
                {item.label}
              </Link>
            );

          return (
            <li key={item.id} className="directory-item">
              &gt; {active === item.id ? item.label : content}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default DirectoryLinks;
