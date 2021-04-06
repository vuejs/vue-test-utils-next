import { compile } from '@vue/compiler-dom'
import {
  toDisplayString,
  createVNode,
  resolveComponent,
  withCtx,
  openBlock,
  createBlock
} from 'vue'
import type { SetupContext } from 'vue'

export function processSlot(
  source = '',
  // this parameter is only used for testing
  // typing it does not matter much
  Vue = {
    toDisplayString,
    createVNode: createVNode as unknown,
    resolveComponent,
    withCtx,
    openBlock,
    createBlock
  }
) {
  let template = source.trim()
  const hasWrappingTemplate = template && template.startsWith('<template')

  // allow content without `template` tag, for easier testing
  if (!hasWrappingTemplate) {
    template = `<template #default="params">${template}</template>`
  }

  const { code } = compile(
    `<SlotWrapper v-bind="$attrs">${template}</SlotWrapper>`,
    {
      mode: 'function',
      prefixIdentifiers: __BROWSER__
    }
  )

  const createRenderFunction = new Function(
    'Vue',
    __BROWSER__ ? `'use strict';\n${code}` : code
  )

  return {
    inheritAttrs: false,
    render: createRenderFunction(Vue),
    components: {
      SlotWrapper: {
        inheritAttrs: false,
        setup(_: Record<string, any>, ctx: SetupContext) {
          return () => {
            const names = Object.keys(ctx.slots)
            if (names.length === 0) {
              return []
            } else {
              const slotName = names[0]
              return ctx.slots[slotName]!(ctx.attrs)
            }
          }
        }
      }
    }
  }
}
