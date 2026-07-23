import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PublicBooking from "./PublicBooking";

const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

const company = {
  id: "co-1",
  name: "Studio Teste",
  slug: "studio-teste",
  timezone: "America/Sao_Paulo",
  appointment_interval_minutes: 30,
};
const service = {
  id: "svc-1",
  name: "Manicure",
  description: null,
  category: null,
  duration_minutes: 60,
  price: 50,
  color: null,
};
const professional = {
  id: "pro-1",
  name: "Ana",
  photo_url: null,
  bio: null,
  specialties: [],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/b/studio-teste"]}>
      <Routes>
        <Route path="/b/:slug" element={<PublicBooking />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicBooking page", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("renders exactly the slots returned by public-availability", async () => {
    const returnedSlots = ["09:00", "09:30", "10:00", "10:30", "11:00"];

    invokeMock.mockImplementation((path: string) => {
      if (typeof path === "string" && path.startsWith("public-company")) {
        return Promise.resolve({
          data: {
            company,
            services: [service],
            professionals: [professional],
            links: [],
          },
          error: null,
        });
      }
      if (path === "public-availability") {
        return Promise.resolve({ data: { slots: returnedSlots }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    renderPage();

    // service step
    const serviceButton = await screen.findByRole("button", { name: /Manicure/i });
    fireEvent.click(serviceButton);

    // professional step
    const proButton = await screen.findByRole("button", { name: /Ana/i });
    fireEvent.click(proButton);

    // date step — pick any enabled day (tomorrow avoids same-day filtering by mock)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayName = new RegExp(`^${tomorrow.getDate()}$`);
    const dayCells = await screen.findAllByRole("gridcell");
    const target = dayCells.find((cell) => dayName.test(cell.textContent ?? ""));
    expect(target).toBeTruthy();
    fireEvent.click(target!);

    // time step: exactly the mocked slots should be rendered as buttons
    await waitFor(() => {
      returnedSlots.forEach((slot) => {
        expect(screen.getByRole("button", { name: slot })).toBeInTheDocument();
      });
    });

    // and no additional times outside the returned list
    const timeButtons = screen
      .getAllByRole("button")
      .filter((b) => /^\d{2}:\d{2}$/.test(b.textContent ?? ""));
    expect(timeButtons.map((b) => b.textContent)).toEqual(returnedSlots);

    // verify the availability call carried the right payload
    const availabilityCall = invokeMock.mock.calls.find(
      ([path]) => path === "public-availability",
    );
    expect(availabilityCall?.[1]?.body).toMatchObject({
      companyId: company.id,
      professionalId: professional.id,
      serviceId: service.id,
    });
  });
});
