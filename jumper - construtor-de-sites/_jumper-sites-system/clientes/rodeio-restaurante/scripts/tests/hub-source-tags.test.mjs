import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderSourceTags } from '../render-source-tags.mjs';

test('Kinsta ganha pill própria quando divide a origem com o Hoster', () => {
  assert.equal(
    renderSourceTags('jumper-hoster · Kinsta'),
    '<span class="card-tags"><span class="tag">jumper-hoster</span><span class="tag tag-kinsta">Kinsta</span></span>',
  );
});

test('origem exclusivamente Kinsta mantém uma única pill laranja', () => {
  assert.equal(renderSourceTags('Kinsta'), '<span class="card-tags"><span class="tag tag-kinsta">Kinsta</span></span>');
});

test('origens sem Kinsta preservam a pill e o texto existentes', () => {
  assert.equal(
    renderSourceTags('jumper-web · jumper-hoster'),
    '<span class="card-tags"><span class="tag">jumper-web · jumper-hoster</span></span>',
  );
});

test('texto de origem é escapado no HTML gerado', () => {
  assert.match(renderSourceTags('jumper-hoster · Kinsta<script>'), /Kinsta&lt;script&gt;/);
});
