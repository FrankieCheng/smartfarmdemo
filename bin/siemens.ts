#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SiemensStack } from '../lib/siemens-stack';
import {AlarmStack} from '../lib/siemens-stack-alarm';

const app = new cdk.App();
new SiemensStack(app, 'SiemensStack');
//new AlarmStack(app, 'AlarmStack');
