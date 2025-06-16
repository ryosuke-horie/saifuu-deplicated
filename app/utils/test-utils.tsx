import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { ReservationProvider } from "../contexts/ReservationContext";

// ReservationProvider付きでコンポーネントをレンダリングするカスタムrender関数
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return <ReservationProvider>{children}</ReservationProvider>;
};

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
): ReturnType<typeof render> =>
	render(ui, { wrapper: AllTheProviders, ...options });

// eslint推奨のre-export
export * from "@testing-library/react";
export { customRender as render };
