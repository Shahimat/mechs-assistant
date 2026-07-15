import { useMemo, useState } from 'react';
import type { Recognized } from '../types';

interface InventoryResultProps {
  items: Recognized[];
}

type Format = 'json' | 'tsv' | 'plain';

function serialize(items: Recognized[], format: Format): string {
  switch (format) {
    case 'json':
      return JSON.stringify(
        items.map((i) => ({
          item_key: i.item_key,
          catalog: i.catalog,
          count: i.count,
          confidence: Number(i.confidence.toFixed(3)),
        })),
        null,
        2
      );
    case 'tsv':
      return [
        'item_key\tcatalog\tcount\tconfidence',
        ...items.map(
          (i) => `${i.item_key}\t${i.catalog ?? ''}\t${i.count}\t${i.confidence.toFixed(3)}`
        ),
      ].join('\n');
    case 'plain':
      return items.map((i) => `${i.item_key} × ${i.count}`).join('\n');
  }
}

export function InventoryResult({ items }: InventoryResultProps) {
  const [format, setFormat] = useState<Format>('tsv');
  const [copied, setCopied] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useState(true);

  const filtered = useMemo(
    () => (showLowConfidence ? items : items.filter((i) => i.confidence >= 0.7)),
    [items, showLowConfidence]
  );

  const totalCount = filtered.reduce((s, i) => s + i.count, 0);

  async function copy() {
    await navigator.clipboard.writeText(serialize(filtered, format));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="inventory-result">
      <div className="row">
        <label>
          <span className="muted">Формат:</span>{' '}
          <select value={format} onChange={(e) => setFormat(e.currentTarget.value as Format)}>
            <option value="tsv">TSV</option>
            <option value="json">JSON</option>
            <option value="plain">Plain (item × N)</option>
          </select>
        </label>
        <button type="button" onClick={() => void copy()}>
          {copied ? '✓ Скопировано' : 'Скопировать'}
        </button>
      </div>
      <p className="muted">
        Позиций: {filtered.length} · суммарно единиц: {totalCount}
      </p>
      <label className="muted">
        <input
          type="checkbox"
          checked={showLowConfidence}
          onChange={(e) => setShowLowConfidence(e.currentTarget.checked)}
        />{' '}
        показывать записи с confidence &lt; 0.7 (кандидаты на ручную сверку)
      </label>

      <table className="results">
        <thead>
          <tr>
            <th>Иконка</th>
            <th>item_key</th>
            <th>catalog</th>
            <th>×</th>
            <th>conf</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((i, idx) => (
            <tr
              key={`${i.item_key}-${idx}`}
              className={i.confidence < 0.7 ? 'low-conf' : undefined}
            >
              <td>
                {i.cell_data_url ? (
                  <img src={i.cell_data_url} alt="" className="cell-thumb" />
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>
                <code>{i.item_key}</code>
                {i.unresolved && <span className="tag">не распознан</span>}
              </td>
              <td>{i.catalog ?? '—'}</td>
              <td className="num">{i.count}</td>
              <td className="num">{i.confidence.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
