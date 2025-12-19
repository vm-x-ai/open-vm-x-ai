#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ECSStack } from '../lib/ecs-stack.js';

const app = new cdk.App();
new ECSStack(app, 'vm-x-ai-ecs-example', {});
