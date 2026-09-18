import type { BackendEngine } from '../types';

type SiteHeaderProps = {
  engine: BackendEngine;
  onEngineChange: (engine: BackendEngine) => void;
};

export function SiteHeader({ engine, onEngineChange }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="wordmark" href="#search">
          <span className="wordmark__mark" aria-hidden="true" />
          Northline
        </a>
        <div className="engine-switch" role="group" aria-label="API engine">
          <button
            type="button"
            className={
              engine === 'node'
                ? 'engine-switch__btn engine-switch__btn--active'
                : 'engine-switch__btn'
            }
            aria-pressed={engine === 'node'}
            onClick={() => onEngineChange('node')}
          >
            Node
          </button>
          <button
            type="button"
            className={
              engine === 'python'
                ? 'engine-switch__btn engine-switch__btn--active'
                : 'engine-switch__btn'
            }
            aria-pressed={engine === 'python'}
            onClick={() => onEngineChange('python')}
          >
            Python
          </button>
        </div>
      </div>
    </header>
  );
}
