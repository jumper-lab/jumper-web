import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderSourceTags } from '../render-source-tags.mjs';

test('Kinsta ganha pill própria quando divide a origem com o Hoster', () => {
  assert.equal(
    renderSourceTags('jumper-hoster · Kinsta'),
    '<span class="card-tags"><span class="tag">jumper-hoster</span><span class="tag tag-kinsta">Kinsta</span><span class="tag tag-webmaster">Webmaster</span></span>',
  );
});

test('origem exclusivamente Kinsta mantém uma única pill laranja', () => {
  assert.equal(renderSourceTags('Kinsta'), '<span class="card-tags"><span class="tag tag-kinsta">Kinsta</span></span>');
});

test('origens sem Kinsta preservam a pill de origem e incluem Webmaster uma vez', () => {
  assert.equal(
    renderSourceTags('jumper-web · jumper-hoster'),
    '<span class="card-tags"><span class="tag">jumper-web · jumper-hoster</span><span class="tag tag-webmaster">Webmaster</span></span>',
  );
});

test('jumper-web sozinho também inclui Webmaster', () => {
  assert.equal(
    renderSourceTags('jumper-web'),
    '<span class="card-tags"><span class="tag">jumper-web</span><span class="tag tag-webmaster">Webmaster</span></span>',
  );
});

test('jumper-hoster-dev é exibido como jumper-hoster, sem alterar a origem Webmaster', () => {
  assert.equal(
    renderSourceTags('jumper-web · jumper-hoster-dev'),
    '<span class="card-tags"><span class="tag">jumper-web · jumper-hoster</span><span class="tag tag-webmaster">Webmaster</span></span>',
  );
});

test('outras origens não recebem Webmaster', () => {
  assert.equal(
    renderSourceTags('jumper-site'),
    '<span class="card-tags"><span class="tag">jumper-site</span></span>',
  );
});

test('Hostinger tem cor própria e pode aparecer com Webmaster', () => {
  assert.equal(
    renderSourceTags('Hostinger · Webmaster'),
    '<span class="card-tags"><span class="tag tag-hostinger">Hostinger</span><span class="tag tag-webmaster">Webmaster</span></span>',
  );
  assert.equal(renderSourceTags('Hostinger'), '<span class="card-tags"><span class="tag tag-hostinger">Hostinger</span></span>');
});

test('texto de origem é escapado no HTML gerado', () => {
  assert.match(renderSourceTags('jumper-hoster · Kinsta<script>'), /Kinsta&lt;script&gt;/);
});
