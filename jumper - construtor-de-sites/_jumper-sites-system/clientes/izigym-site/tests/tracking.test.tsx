import React, { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, useNavigate } from "react-router-dom";
import { bootstrapPrincipalTracking, principalTrackingTags } from "../src/tracking/bootstrap.mjs";
import { attributedCheckoutHref, principalCheckoutTelemetry, setupPrincipalTracking } from "@/tracking/principal";
import { TrackingAttribution } from "@/components/TrackingAttribution";
import { PlanosSection } from "@/components/gym/PlanosSection";
import { WhatsAppButton } from "@/components/gym/WhatsAppButton";
import { StickyMobileCTA } from "@/components/gym/StickyMobileCTA";
import { FAQSection } from "@/components/gym/FAQSection";
import config from "@/data/tracking.json";

const checkout = "https://vendas.online.sistemapacto.com.br/checkout?un=1&pl=2&k=account&cupom=OFERTA&_gl=existing#keep";
const events = () => (window.dataLayer || []).filter((entry: Record<string, unknown>) => ["checkout_click", "whatsapp_click"].includes(String(entry.event))) as Record<string, unknown>[];
const addLink = (href=checkout, placement="plan_card_izi_one") => {
  const link = document.createElement("a"); link.href=href; link.dataset.checkout=placement;
  link.target="_blank";link.innerHTML="<span>Contratar</span>"; document.body.appendChild(link); return link;
};
beforeEach(() => {
  window.iziPrincipalTrackingRuntime?.dispose();
  delete window.iziPrincipalTracking;
  window.dataLayer=[];document.body.innerHTML="";
  document.querySelectorAll('script[src*="googletagmanager"], #izi-principal-tracking').forEach(node=>node.remove());
  window.sessionStorage.clear();window.history.replaceState({},"","/");
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  window.matchMedia = vi.fn().mockReturnValue({ matches:true, addEventListener:vi.fn(), removeEventListener:vi.fn() });
});
afterEach(() => { cleanup();window.iziPrincipalTrackingRuntime?.dispose();vi.restoreAllMocks();vi.unstubAllGlobals(); });

describe("principal GTM loader", () => {
 it("preserves a queued consent command and loads only Izi once", () => {
  const consent=["consent","default",{analytics_storage:"denied"}];const layer=window.dataLayer=[consent,{event:"queued"}];
  bootstrapPrincipalTracking(config);bootstrapPrincipalTracking(config);
  expect(window.dataLayer).toBe(layer);expect(layer[0]).toBe(consent);
  expect(layer.filter((x: Record<string, unknown>)=>x.event==="gtm.js")).toHaveLength(1);
  expect(document.querySelectorAll('script[src*="gtm.js"]')).toHaveLength(1);
  expect((document.querySelector('script[src*="gtm.js"]') as HTMLScriptElement).src).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-TGQTFXTN");
  expect(events()).toHaveLength(0);
 });
 it("reuses an existing startup and loader even with extra query parameters", () => {
  window.dataLayer=[{"event":"gtm.js"}];const script=document.createElement("script");script.src="https://www.googletagmanager.com/gtm.js?id=GTM-TGQTFXTN&test=existing";document.head.appendChild(script);
  bootstrapPrincipalTracking(config);
  expect(window.dataLayer.filter((x: Record<string, unknown>)=>x.event==="gtm.js")).toHaveLength(1);
  expect(document.querySelectorAll('script[src*="gtm.js"]')).toHaveLength(1);
 });
 it("disabling Izi removes both loader and noscript without a URL override", () => {
  window.history.replaceState({},"","/?izi_enabled=true&tracking=on");
  const disabled={...config,izi:{...config.izi,enabled:false}};
  bootstrapPrincipalTracking(disabled);
  expect(document.querySelector('script[src*="gtm.js"]')).toBeNull();
  expect(principalTrackingTags(disabled)).toHaveLength(1);
  const link=addLink();setupPrincipalTracking();fireEvent.click(link);
  expect(events()[0]).toMatchObject({event:"checkout_click",site_id:"principal",izi_enabled:false});
 });
 it("provides the head script and body-first noscript and rejects invalid configuration", () => {
  const tags=principalTrackingTags(config);
  expect(tags[0].injectTo).toBe("head");expect(tags[1].injectTo).toBe("body-prepend");
  expect(tags[1].children).toContain("ns.html?id=GTM-TGQTFXTN");
  expect(()=>principalTrackingTags({...config,izi:{enabled:true,gtmId:"GTM-WRONG"}})).toThrow();
 });
});

describe("real link activation", () => {
 it("emits once from a nested target and preserves queued messages", () => {
  const link=addLink();const first={event:"queued"};window.dataLayer=[first];setupPrincipalTracking();fireEvent.click(link.querySelector("span")!);
  expect(events()).toHaveLength(1);expect(window.dataLayer[0]).toBe(first);
  expect(events()[0]).toMatchObject({event:"checkout_click",site_id:"principal",izi_enabled:true,placement:"plan_card_izi_one"});
  expect(events()[0]).not.toHaveProperty("plan_id");expect(events()[0]).not.toHaveProperty("unit_id");
 });
 it("tracks independent rapid clicks and middle-button activation without right-click noise", () => {
  const link=addLink();setupPrincipalTracking();fireEvent.click(link);fireEvent.click(link);fireEvent(link,new MouseEvent("auxclick",{bubbles:true,button:1}));fireEvent(link,new MouseEvent("auxclick",{bubbles:true,button:2}));
  expect(events()).toHaveLength(3);
 });
 it("does not count prevented links, internal scrolling, other hosts or page opening as checkout", () => {
  setupPrincipalTracking();expect(events()).toHaveLength(0);
  const canceled=addLink();canceled.addEventListener("click",e=>e.preventDefault());fireEvent.click(canceled);
  for(const href of ["#planos","https://other.example/checkout","javascript:void(0)","https://vendas.online.sistemapacto.com.br/other"])fireEvent.click(addLink(href));
  fireEvent.scroll(window);expect(events()).toHaveLength(0);
 });
 it("survives late React links, repeated initialization and actual component remounts", async () => {
  const spy=vi.spyOn(document,"addEventListener");setupPrincipalTracking();const clicks=spy.mock.calls.filter(([name])=>name==="click").length;
  const mounted=render(<StrictMode><PlanosSection /></StrictMode>);setupPrincipalTracking();
  fireEvent.click(document.querySelector('a[data-checkout="plan_card_izi_one"]')!);mounted.unmount();
  render(<StrictMode><PlanosSection /></StrictMode>);setupPrincipalTracking();fireEvent.click(document.querySelector('a[data-checkout="plan_card_izi_prime"]')!);
  expect(events()).toHaveLength(2);expect(spy.mock.calls.filter(([name])=>name==="click")).toHaveLength(clicks);
 });
 it("does not multiply listeners when the route lifecycle remounts", () => {
  const spy=vi.spyOn(document,"addEventListener");
  const first=render(<StrictMode><MemoryRouter><TrackingAttribution /><PlanosSection /></MemoryRouter></StrictMode>);
  const count=spy.mock.calls.filter(([name])=>name==="click").length;first.unmount();
  render(<StrictMode><MemoryRouter><TrackingAttribution /><PlanosSection /></MemoryRouter></StrictMode>);
  fireEvent.click(document.querySelector('a[data-checkout="plan_card_izi_one"]')!);
  expect(events()).toHaveLength(1);expect(spy.mock.calls.filter(([name])=>name==="click")).toHaveLength(count);
 });
 it("produces only logical events and never calls platform senders", () => {
  const fbq=vi.fn(),gtag=vi.fn();vi.stubGlobal("fbq",fbq);vi.stubGlobal("gtag",gtag);
  render(<><PlanosSection /><FAQSection /><WhatsAppButton /><StickyMobileCTA /></>);setupPrincipalTracking();
  document.querySelectorAll("a[data-checkout],a[data-whatsapp]").forEach(link=>fireEvent.click(link));
  expect(events().map(x=>x.placement)).toEqual(["plan_card_izi_one","plan_card_izi_prime","whatsapp_faq_contact","whatsapp_floating_desktop","whatsapp_mobile_sticky"]);
  expect(events()).toHaveLength(5);expect(fbq).not.toHaveBeenCalled();expect(gtag).not.toHaveBeenCalled();
 });
 it("keeps WhatsApp recipient and message intact without adding them to events", () => {
  const view=render(<><WhatsAppButton /><StickyMobileCTA /><FAQSection /></>);setupPrincipalTracking();
  for(const link of view.container.querySelectorAll<HTMLAnchorElement>("a[data-whatsapp]")){
   const original=link.href;fireEvent.click(link);
   expect(link.href).toBe(original);expect(events().at(-1)).toEqual({event:"whatsapp_click",site_id:"principal",izi_enabled:true,placement:link.dataset.whatsapp,channel_id:"principal_sales"});
  }
 });
 it("does not block a link when the dataLayer consumer throws", () => {
  const link=addLink();setupPrincipalTracking();window.dataLayer.push=()=>{throw new Error("tool not ready");};
  const event=new MouseEvent("click",{bubbles:true,cancelable:true});
  expect(()=>link.dispatchEvent(event)).not.toThrow();expect(event.defaultPrevented).toBe(false);
 });
});

describe("navigation and private attribution", () => {
 it("decorates only Pacto links and cannot replace commercial parameters or _gl", () => {
  const result=new URL(attributedCheckoutHref(checkout,{utm_source:"new",gclid:"click",k:"replace",pl:"99",un:"99",cupom:"replace",_gl:"replace"}));
  expect(result.searchParams.get("k")).toBe("account");expect(result.searchParams.get("pl")).toBe("2");expect(result.searchParams.get("un")).toBe("1");expect(result.searchParams.get("cupom")).toBe("OFERTA");expect(result.searchParams.get("_gl")).toBe("existing");expect(result.hash).toBe("#keep");
  expect(attributedCheckoutHref("https://wa.me/5511000000000?text=original",{utm_source:"new"})).toBe("https://wa.me/5511000000000?text=original");
 });
 it("sanitizes credentials, fragments, account keys, conversation data and personal UTMs separately", () => {
  const telemetry=principalCheckoutTelemetry("https://user:password@vendas.online.sistemapacto.com.br/checkout?un=1&pl=2&cupom=OFERTA&k=account&_gl=private&text=private&utm_source=normal&utm_email=a%40example.com&utm_content=person%2540example.com&utm_term=%2B55%20(11)%2099999-9999&gbraid=click#private");
  expect(telemetry).toEqual({checkout_url:"https://vendas.online.sistemapacto.com.br/checkout?un=1&pl=2&cupom=OFERTA&utm_source=normal&gbraid=click",utm_source:"normal",gbraid:"click"});
 });
 it("retains numeric campaign IDs while filtering contact-looking free text and coupon values", () => {
  const telemetry=principalCheckoutTelemetry(checkout+"&utm_id=123456789012");
  const sensitive=principalCheckoutTelemetry("https://vendas.online.sistemapacto.com.br/planos?utm_id=123456789012&utm_campaign=11999990000&cupom=person%40example.com");
  expect(sensitive).toMatchObject({utm_id:"123456789012"});expect(sensitive).not.toHaveProperty("utm_campaign");expect(sensitive.checkout_url).not.toContain("cupom=");
  expect(telemetry.checkout_url).not.toContain("account");
 });
 it("keeps session attribution on no-query arrival and refresh, with Google _gl added late", () => {
  window.history.replaceState({},"","/?utm_source=first&gclid=first&gbraid=braid");const link=addLink();const runtime=setupPrincipalTracking();
  const decorated=new URL(link.href);decorated.searchParams.set("_gl","added_late");link.href=decorated.href;
  window.history.replaceState({},"","/");fireEvent(window,new Event("pageshow"));runtime.refresh();fireEvent.click(link);
  expect(events()[0]).toMatchObject({utm_source:"first",gclid:"first",gbraid:"braid"});expect(new URL(link.href).searchParams.get("_gl")).toBe("added_late");
 });
 it("replaces stale campaign and click IDs on a new arrival and on popstate", () => {
  window.history.replaceState({},"","/?utm_source=first&gclid=old&gbraid=old");const link=addLink();setupPrincipalTracking();
  window.history.replaceState({},"","/?utm_source=new&wbraid=fresh");fireEvent(window,new PopStateEvent("popstate"));fireEvent.click(link);
  expect(events()[0]).toMatchObject({utm_source:"new",wbraid:"fresh"});expect(events()[0]).not.toHaveProperty("gclid");expect(events()[0]).not.toHaveProperty("gbraid");
 });
 it("treats an arrival with only a new click identifier as a new campaign", () => {
  window.history.replaceState({},"","/?utm_source=old&gclid=old");const link=addLink();setupPrincipalTracking();
  window.history.replaceState({},"","/?gbraid=fresh");fireEvent(window,new PopStateEvent("popstate"));fireEvent.click(link);
  expect(events()[0]).toMatchObject({gbraid:"fresh"});expect(events()[0]).not.toHaveProperty("utm_source");expect(events()[0]).not.toHaveProperty("gclid");
 });
 it("keeps personal arrival values out of telemetry without changing commercial attribution", () => {
  window.history.replaceState({},"","/?utm_source=normal&utm_email=person%40example.com&msclkid=person%40example.com");const link=addLink();setupPrincipalTracking();fireEvent.click(link);
  expect(new URL(link.href).searchParams.get("utm_email")).toBe("person@example.com");
  expect(new URL(link.href).searchParams.get("msclkid")).toBe("person@example.com");
  expect(events()[0]).not.toHaveProperty("utm_email");expect(events()[0]).not.toHaveProperty("msclkid");expect(String(events()[0].checkout_url)).not.toContain("person");
 });
 it("updates the same mounted links after a React route/search transition", () => {
  const Navigation=()=>{const navigate=useNavigate();return <button onClick={()=>navigate("/?utm_source=second")}>Navigate</button>;};
  const view=render(<BrowserRouter><TrackingAttribution /><Navigation /><PlanosSection /></BrowserRouter>);
  fireEvent.click(view.getByText("Navigate"));expect(events()).toHaveLength(0);
  const link=document.querySelector<HTMLAnchorElement>('a[data-checkout="plan_card_izi_one"]')!;
  expect(new URL(link.href).searchParams.get("utm_source")).toBe("second");
  fireEvent.click(link);expect(events()[0]).toMatchObject({utm_source:"second"});
 });
 it("survives disabled and corrupt storage without losing the current arrival", () => {
  window.sessionStorage.setItem("izi:principal-attribution:v1","broken");const link=addLink();setupPrincipalTracking();fireEvent.click(link);expect(events()).toHaveLength(1);
  window.history.replaceState({},"","/?utm_source=arrival&msclkid=click");vi.spyOn(Storage.prototype,"getItem").mockImplementation(()=>{throw new Error("blocked");});vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("blocked");});
  fireEvent.click(link);expect(events()[1]).toMatchObject({utm_source:"arrival",msclkid:"click"});
 });
});
