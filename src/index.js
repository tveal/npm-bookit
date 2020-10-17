#!/usr/bin/env node
import { FileConnector } from './utils';

const cx = new FileConnector();
cx.buildBook();
