"use client";

import { generateClient } from "aws-amplify/data";

import type { Schema } from "@backend/data/resource";

export const amplifyClient = generateClient<Schema>();
