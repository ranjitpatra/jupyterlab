// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect } from 'chai';

import { ILabShell, LayoutRestorer } from '@jupyterlab/application';

import { WidgetTracker } from '@jupyterlab/apputils';

import { StateDB } from '@jupyterlab/statedb';

import { CommandRegistry } from '@lumino/commands';

import { PromiseDelegate } from '@lumino/coreutils';

import { DockPanel, Widget } from '@lumino/widgets';

describe('apputils', () => {
  describe('LayoutRestorer', () => {
    describe('#constructor()', () => {
      it('should construct a new layout restorer', () => {
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: Promise.resolve<void>(void 0),
          registry: new CommandRegistry()
        });
        expect(restorer).to.be.an.instanceof(LayoutRestorer);
      });
    });

    describe('#restored', () => {
      it('should be a promise available right away', () => {
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: Promise.resolve<void>(void 0),
          registry: new CommandRegistry()
        });
        expect(restorer.restored).to.be.an.instanceof(Promise);
      });

      it('should resolve when restorer is done', async () => {
        const ready = new PromiseDelegate<void>();
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: ready.promise,
          registry: new CommandRegistry()
        });
        let promise = restorer.restored;
        ready.resolve(void 0);
        await promise;
      });
    });

    describe('#add()', () => {
      it('should add a widget to be tracked by the restorer', async () => {
        const ready = new PromiseDelegate<void>();
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: ready.promise,
          registry: new CommandRegistry()
        });
        const currentWidget = new Widget();
        const mode: DockPanel.Mode = 'single-document';
        const dehydrated: ILabShell.ILayout = {
          mainArea: { currentWidget, dock: null, mode },
          leftArea: { collapsed: true, currentWidget: null, widgets: null },
          rightArea: { collapsed: true, currentWidget: null, widgets: null }
        };
        restorer.add(currentWidget, 'test-one');
        ready.resolve(void 0);
        await restorer.restored;
        await restorer.save(dehydrated);
        const layout = await restorer.fetch();
        expect(layout.mainArea?.currentWidget).to.equal(currentWidget);
        expect(layout.mainArea?.mode).to.equal(mode);
      });
    });

    describe('#fetch()', () => {
      it('should always return a value', async () => {
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: Promise.resolve(void 0),
          registry: new CommandRegistry()
        });
        const layout = await restorer.fetch();
        expect(layout).to.not.equal(null);
      });

      it('should fetch saved data', async () => {
        const ready = new PromiseDelegate<void>();
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: ready.promise,
          registry: new CommandRegistry()
        });
        const currentWidget = new Widget();
        // The `fresh` attribute is only here to check against the return value.
        const dehydrated: ILabShell.ILayout = {
          fresh: false,
          mainArea: { currentWidget: null, dock: null, mode: null },
          leftArea: {
            currentWidget,
            collapsed: true,
            widgets: [currentWidget]
          },
          rightArea: { collapsed: true, currentWidget: null, widgets: null }
        };
        restorer.add(currentWidget, 'test-one');
        ready.resolve(void 0);
        await restorer.restored;
        await restorer.save(dehydrated);
        const layout = await restorer.fetch();
        expect(layout).to.deep.equal(dehydrated);
      });
    });

    describe('#restore()', () => {
      it('should restore the widgets in a tracker', async () => {
        const tracker = new WidgetTracker({ namespace: 'foo-widget' });
        const registry = new CommandRegistry();
        const state = new StateDB();
        const ready = new PromiseDelegate<void>();
        const restorer = new LayoutRestorer({
          connector: state,
          first: ready.promise,
          registry
        });
        let called = false;
        const key = `${tracker.namespace}:${tracker.namespace}`;

        registry.addCommand(tracker.namespace, {
          execute: () => {
            called = true;
          }
        });
        await state.save(key, { data: null });
        ready.resolve(undefined);
        await restorer.restore(tracker, {
          name: () => tracker.namespace,
          command: tracker.namespace
        });
        await restorer.restored;
        expect(called).to.equal(true);
      });
    });

    describe('#save()', () => {
      it('should not run before `first` promise', async () => {
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: new Promise(() => {
            // no op
          }),
          registry: new CommandRegistry()
        });
        const dehydrated: ILabShell.ILayout = {
          mainArea: { currentWidget: null, dock: null, mode: null },
          leftArea: { currentWidget: null, collapsed: true, widgets: null },
          rightArea: { collapsed: true, currentWidget: null, widgets: null }
        };
        try {
          await restorer.save(dehydrated);
        } catch (e) {
          expect(e).to.equal('save() was called prematurely.');
        }
      });

      it('should save data', async () => {
        const ready = new PromiseDelegate<void>();
        const restorer = new LayoutRestorer({
          connector: new StateDB(),
          first: ready.promise,
          registry: new CommandRegistry()
        });
        const currentWidget = new Widget();
        // The `fresh` attribute is only here to check against the return value.
        const dehydrated: ILabShell.ILayout = {
          fresh: false,
          mainArea: { currentWidget: null, dock: null, mode: null },
          leftArea: {
            currentWidget,
            collapsed: true,
            widgets: [currentWidget]
          },
          rightArea: { collapsed: true, currentWidget: null, widgets: null }
        };
        restorer.add(currentWidget, 'test-one');
        ready.resolve(void 0);
        await restorer.restored;
        await restorer.save(dehydrated);
        const layout = await restorer.fetch();
        expect(layout).to.deep.equal(dehydrated);
      });
    });
  });
});
