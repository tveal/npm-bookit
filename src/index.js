#!/usr/bin/env node
import { FileConnector } from './connector';

const cx = new FileConnector();
cx.buildBook();
