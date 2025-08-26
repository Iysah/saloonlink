"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { TProfile } from "@/types/profile.type";
import { useMemo } from "react";

const PRIMARY_COLOR = "#059669";
const SECONDARY_COLOR = "#34d399";

interface AnalyticsProps {
  userProfile: TProfile | null;
  rawAppointments: any[];
  rawQueue: any[];
  rawServices: any[];
}

export const Analytics = ({
  userProfile,
  rawAppointments,
  rawQueue,
  rawServices,
}: AnalyticsProps) => {
  const subs = useMemo(() => {
    return userProfile?.subscription?.subscription;
  }, [userProfile]);
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  // ? appointments data
  const todayAppointments = rawAppointments.filter((appt) =>
    isSameDay(parseISO(appt.appointment_date), now)
  );
  const weekAppointments = rawAppointments.filter(
    (appt) =>
      parseISO(appt.appointment_date) >= weekStart &&
      parseISO(appt.appointment_date) <= weekEnd
  );

  // ? revenue
  const todayRevenue = todayAppointments.reduce((sum, appt) => {
    const service = rawServices.find((s) => s.id === appt.service_id);
    return sum + (service ? parseFloat(service.price) : 0);
  }, 0);

  const weekRevenue = weekAppointments.reduce((sum, appt) => {
    const service = rawServices.find((s) => s.id === appt.service_id);
    return sum + (service ? parseFloat(service.price) : 0);
  }, 0);

  // ? queue/walk-ins
  const todayQueue = rawQueue.filter((item) =>
    isSameDay(parseISO(item.join_time), now)
  );
  const weekQueue = rawQueue.filter(
    (item) =>
      parseISO(item.join_time) >= weekStart &&
      parseISO(item.join_time) <= weekEnd
  );

  //? chart data
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const appointmentsByDay = weekDays.map((day) => {
    const dayStr = format(day, "EEE");
    const count = rawAppointments.filter((appt) =>
      isSameDay(parseISO(appt.appointment_date), day)
    ).length;
    return { name: dayStr, value: count };
  });

  const revenueByDay = weekDays.map((day) => {
    const dayStr = format(day, "EEE");
    const revenue = rawAppointments
      .filter((appt) => isSameDay(parseISO(appt.appointment_date), day))
      .reduce((sum, appt) => {
        const service = rawServices.find((s) => s.id === appt.service_id);
        return sum + (service ? parseFloat(service.price) : 0);
      }, 0);
    return { name: dayStr, value: revenue };
  });

  const servicePopularity = rawServices.map((service) => {
    const count = rawAppointments.filter(
      (appt) => appt.service_id === service.id
    ).length;
    return { name: service.service_name, value: count };
  });

  //? peak hours
  const hourCounts = Array(24)
    .fill(0)
    .map((_, i) => ({ hour: i, count: 0 }));
  rawAppointments.forEach((appt) => {
    const hour = parseInt(appt.appointment_time.split(":")[0]);
    hourCounts[hour].count++;
  });
  const peakHours = hourCounts
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((h) => ({ name: `${h.hour}:00`, value: h.count }));

  if (!subs?.features?.analytics?.basic) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayAppointments.length}</div>
            <p className="text-sm text-muted-foreground">
              {weekAppointments.length} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₦{todayRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              ₦{weekRevenue.toLocaleString()} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Walk-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayQueue.length}</div>
            <p className="text-sm text-muted-foreground">
              {weekQueue.length} this week
            </p>
          </CardContent>
        </Card>
      </div>

      {subs?.features?.analytics?.intermediate && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Appointments</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={appointmentsByDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    name="Appointments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `₦${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill={PRIMARY_COLOR}
                    name="Revenue (₦)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Popularity</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicePopularity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill={SECONDARY_COLOR}
                    name="Appointments"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {subs?.features?.analytics?.advanced && (
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="value"
                  fill={PRIMARY_COLOR}
                  name="Appointments"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
