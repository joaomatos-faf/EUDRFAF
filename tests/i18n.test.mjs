import test from "node:test";
import assert from "node:assert/strict";
import { translations } from "../app/lib/i18n.ts";

test("i18n dictionary possui correspondência 1:1 entre Português e Inglês", () => {
  const ptKeys = Object.keys(translations.pt).sort();
  const enKeys = Object.keys(translations.en).sort();

  assert.deepEqual(ptKeys, enKeys, "As chaves de tradução em Português e Inglês devem ser idênticas");
  
  ptKeys.forEach((key) => {
    assert.ok(translations.pt[key]?.length > 0, `Chave ${key} não deve ser vazia em PT`);
    assert.ok(translations.en[key]?.length > 0, `Chave ${key} não deve ser vazia em EN`);
  });
});
