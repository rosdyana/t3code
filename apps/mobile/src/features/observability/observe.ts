import { Observe } from "expo-observe";

// expo-observe stays linked, but this build never dispatches crash reports or startup metrics.
Observe.configure({ dispatchingEnabled: false });
