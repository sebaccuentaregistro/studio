'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Calendar, Users, ClipboardList, Star, Warehouse, AlertTriangle, User as UserIcon, DoorOpen, LineChart, CheckCircle2, ClipboardCheck, Plane, CalendarClock, Info, Settings, ArrowLeft, DollarSign, Signal } from 'lucide-react';
import Link from 'next/link';
import { useStudio } from '@/context/StudioContext';
import type { Session } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentPaymentStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/whatsapp-icon';
import { Button } from '@/components/ui/button';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter, useSearchParams } from 'next/navigation';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';

function AppNotifications() {
    const { notifications, sessions, people, actividades, enrollFromWaitlist, dismissNotification } = useStudio();
    const sortedNotifications = useMemo(() => notifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notifications]);


    if (sortedNotifications.length === 0) return null;

    return (
        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Info className="h-5 w-5 text-blue-500" />
                    Notificaciones Importantes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {sortedNotifications.map(notification => {
                    if (notification.type === 'waitlist' && notification.sessionId) {
                        const session = sessions.find(s => s.id === notification.sessionId);
                        const person = people.find(p => p.id === notification.personId);
                        constividad = session ? actividades.find(a => a.id === session.actividadId) : null;

                        if (!session || !person || !actividad) {
                            return (
                                <div key={notification.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                                    <p className="text-muted-foreground">Esta notificación ya no es válida.</p>
                                    <Button size="sm" variant="ghost" onClick={() => dismissNotification(notification.id)}>Descartar</Button>
                                </div>
                            );
                        }

                        return (
                            <div key={notification.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-blue-500/10 text-sm">
                                <p className="flex-grow text-blue-800 dark:text-blue-200">
                                    ¡Cupo liberado en <span className="font-semibold">{actividad.name}</span> ({session.dayOfWeek} {session.time})! ¿Deseas inscribir a <span className="font-semibold">{person.name}</span>?
                                </p>
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <Button size="sm" onClick={() => enrollFromWaitlist(notification.id, session.id, person.id)}>Inscribir</Button>
                                    <Button size="sm" variant="ghost" onClick={() => dismissNotification(notification.id)}>Descartar</Button>
                                </div>
                            </div>
                        );
                    }
                    if (notification.type === 'churnRisk') {
                        const person = people.find(p => p.id === notification.personId);
                        if (!person || person.status === 'inactive') return null; // Stale notification or inactive person

                        return (
                            <div key={notification.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-yellow-500/10 text-sm">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <p className="flex-grow text-yellow-800 dark:text-yellow-200">
                                        Riesgo de abandono: <span className="font-semibold">{person.name}</span> ha faltado a 3 clases seguidas. Considera contactarle.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <Button size="sm" variant="ghost" onClick={() => dismissNotification(notification.id)}>Descartar</Button>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </CardContent>
        </Card>
    );
}


// Helper function to render student cards inside the sheet
function EnrolledStudentsSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { people, actividades, specialists, spaces, attendance, isPersonOnVacation } = useStudio();
  
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const today = useMemo(() => new Date(), []);

  const enrolledPeople = useMemo(() => {
    const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
    const oneTimeIds = attendanceRecord?.oneTimeAttendees || [];
    
    const regularIds = session.personIds.filter(pid => {
        const person = people.find(p => p.id === pid);
        return person && person.status === 'active' && !isPersonOnVacation(person, today);
    });
    
    const allEnrolledIds = [...new Set([...regularIds, ...oneTimeIds])];
    
    return people
      .filter(p => p.status === 'active' && allEnrolledIds.includes(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, session, attendance, todayStr, isPersonOnVacation, today]);

  const sessionDetails = useMemo(() => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    constividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    return { specialist,ividad, space };
  }, [session, specialists, actividades, spaces]);

  const formatWhatsAppLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Inscriptos en {sessionDetails.actividad?.name || 'Sesión'}</SheetTitle>
          <SheetDescription>
            {session.dayOfWeek} a las {session.time} en {sessionDetails.space?.name || 'N/A'}.
            <br/>
            {enrolledPeople.length} de {sessionDetails.space?.capacity || 0} personas inscriptas.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 space-y-4 h-[calc(100%-8rem)] pr-4">
          {enrolledPeople.length > 0 ? (
            enrolledPeople.map(person => (
              <Card key={person.id} className="p-3 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border-white/20">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{person.name}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span>{person.phone}</span>
                       <a href={formatWhatsAppLink(person.phone)} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon className="text-green-600 hover:text-green-700 transition-colors" />
                          <span className="sr-only">Enviar WhatsApp a {person.name}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/30">
                <p className="text-sm text-slate-500 dark:text-slate-400">No hay personas inscriptas.</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function DashboardPageContent() {
  const { sessions, specialists, actividades, spaces, people, attendance, isPersonOnVacation, isTutorialOpen, openTutorial, closeTutorial, levels } = useStudio();
  const [filters, setFilters] = useState({
    actividadId: 'all',
    spaceId: 'all',
    specialistId: 'all',
    timeOfDay: 'all',
  });
  const [selectedSessionForStudents, setSelectedSessionForStudents] = useState<Session | null>(null);
  const [sessionForAttendance, setSessionForAttendance] = useState<Session | null>(null);

  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialCompleted = localStorage.getItem('agendia-tutorial-completed');
      if (!tutorialCompleted) {
        openTutorial();
      }
      setIsInitialCheckDone(true);
    }
  }, [openTutorial]);


  const searchParams = useSearchParams();
  const dashboardView = searchParams.get('view') === 'management' ? 'management' : 'main';

  const activePeople = useMemo(() => people.filter(p => p.status === 'active'), [people]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return activePeople.filter(p => getStudentPaymentStatus(p, now) === 'Atrasado').length;
  }, [activePeople]);

  const onVacationCount = useMemo(() => {
    const now = new Date();
    return activePeople.filter(p => isPersonOnVacation(p, now)).length;
  }, [activePeople, isPersonOnVacation]);

  const pendingRecoveryCount = useMemo(() => {
    const balances: Record<string, number> = {};
    activePeople.forEach(p => (balances[p.id] = 0));

    attendance.forEach(record => {
      record.justifiedAbsenceIds?.forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]++;
      });
      record.oneTimeAttendees?.forEach(personId => {
        if (balances[personId] !== undefined) balances[personId]--;
      });
    });

    return Object.values(balances).filter(balance => balance > 0).length;
  }, [activePeople, attendance]);

  const hasOverdue = overdueCount > 0;
  const hasOnVacation = onVacationCount > 0;
  const hasPendingRecovery = pendingRecoveryCount > 0;

  const mainCards = [
    { href: "/schedule", label: "Horarios", icon: Calendar, count: sessions.length },
    { href: "/students", label: "Personas", icon: Users, count: activePeople.length },
  ];
  
  const managementCards = [
    { href: "/instructors", label: "Especialistas", icon: ClipboardList, count: specialists.length },
    { href: "/specializations", label: "Actividades", icon: Star, count: actividades.length },
    { href: "/spaces", label: "Espacios", icon: Warehouse, count: spaces.length },
    { href: "/levels", label: "Niveles", icon: Signal, count: levels.length },
    { href: "/tariffs", label: "Aranceles", icon: DollarSign, count: null },
    { href: "/statistics", label: "Estadísticas", icon: LineChart, count: null },
  ];

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const { todaysSessions, filteredSessions, todayName } = useMemo(() => {
    const dayMap: { [key: number]: Session['dayOfWeek'] } = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
    const today = new Date();
    const todayName = dayMap[today.getDay()];
    const todayStr = format(today, 'yyyy-MM-dd');

    const getTimeOfDay = (time: string): 'Mañana' | 'Tarde' | 'Noche' => {
        if (!time) return 'Tarde';
        const hour = parseInt(time.split(':')[0], 10);
        if (hour < 12) return 'Mañana';
        if (hour < 18) return 'Tarde';
        return 'Noche';
    };

    const todaysSessions = sessions
      .filter(session => session.dayOfWeek === todayName)
      .map(session => {
        const attendanceRecord = attendance.find(a => a.sessionId === session.id && a.date === todayStr);
        const oneTimeAttendees = attendanceRecord?.oneTimeAttendees || [];
        const activeRegulars = session.personIds.filter(pid => {
            const person = people.find(p => p.id === pid);
            return person && person.status === 'active' && !isPersonOnVacation(person, today);
        });
        return {
          ...session,
          enrolledCount: activeRegulars.length + oneTimeAttendees.length,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    const filtered = todaysSessions.filter(session => {
        const timeOfDay = getTimeOfDay(session.time);
        return (
            (filters.actividadId === 'all' || session.actividadId === filters.actividadId) &&
            (filters.spaceId === 'all' || session.spaceId === filters.spaceId) &&
            (filters.specialistId === 'all' || session.instructorId === filters.specialistId) &&
            (filters.timeOfDay === 'all' || timeOfDay === filters.timeOfDay)
        );
    });

    return { todaysSessions, filteredSessions: filtered, todayName };
  }, [sessions, filters, attendance, people, isPersonOnVacation]);

  const getSessionDetails = (session: Session) => {
    const specialist = specialists.find((i) => i.id === session.instructorId);
    constividad = actividades.find((s) => s.id === session.actividadId);
    const space = spaces.find((s) => s.id === session.spaceId);
    return { specialist,ividad, space };
  };

  const formatTime = (time: string) => {
    if (!time || !time.includes(':')) return 'N/A';
    return time;
  };

  return (
    <div className="space-y-8">
      {isInitialCheckDone && <OnboardingTutorial isOpen={isTutorialOpen} onClose={closeTutorial} />}

      <AppNotifications />
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {dashboardView === 'main' ? (
          <>
            <Link href="/students?filter=overdue" className="transition-transform hover:-translate-y-1">
              <Card className={cn(
                  "group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 aspect-square",
                  hasOverdue ? "hover:!border-destructive" : "hover:!border-green-500"
              )}>
                  <div className={cn(
                      "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                      hasOverdue ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-600"
                  )}>
                      <AlertTriangle className="h-4 w-4" />
                  </div>
                  <CardTitle className={cn("text-lg font-semibold", hasOverdue ? "text-destructive" : "text-green-600")}>
                      Atrasados
                  </CardTitle>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{overdueCount}</p>
              </Card>
            </Link>
            <Link href="/students?filter=pending-recovery" className="transition-transform hover:-translate-y-1">
              <Card className={cn(
                  "group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 aspect-square",
                  hasPendingRecovery ? "hover:!border-yellow-500" : "hover:!border-green-500"
              )}>
                  <div className={cn(
                      "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                      hasPendingRecovery ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"
                  )}>
                      <CalendarClock className="h-4 w-4" />
                  </div>
                  <CardTitle className={cn("text-lg font-semibold", hasPendingRecovery ? "text-yellow-600" : "text-green-600")}>
                      Recuperos
                  </CardTitle>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{pendingRecoveryCount}</p>
              </Card>
            </Link>
            <Link href="/students?filter=on-vacation" className="transition-transform hover:-translate-y-1">
              <Card className={cn(
                  "group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 aspect-square",
                  hasOnVacation ? "hover:!border-blue-500" : "hover:!border-green-500"
              )}>
                  <div className={cn(
                      "flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full",
                      hasOnVacation ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                  )}>
                      <Plane className="h-4 w-4" />
                  </div>
                  <CardTitle className={cn("text-lg font-semibold", hasOnVacation ? "text-blue-600" : "text-green-600")}>
                      Vacaciones
                  </CardTitle>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{onVacationCount}</p>
              </Card>
            </Link>
            {mainCards.map((item) => (
              <Link key={item.href} href={item.href} className="transition-transform hover:-translate-y-1">
                <Card className="group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:!border-primary aspect-square">
                    <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">{item.label}</CardTitle>
                    {item.count !== null && (
                      <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{item.count}</p>
                    )}
                </Card>
              </Link>
            ))}
            <Link href="/dashboard?view=management" className="transition-transform hover:-translate-y-1">
              <Card className="group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:!border-primary aspect-square">
                  <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Settings className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">Gestión</CardTitle>
                   <p className="text-2xl font-bold text-transparent select-none" aria-hidden="true">&nbsp;</p>
              </Card>
            </Link>
          </>
        ) : (
          <>
            {managementCards.map((item) => (
              <Link key={item.href} href={item.href} className="transition-transform hover:-translate-y-1">
                <Card className="group flex flex-col items-center justify-center p-2 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:!border-primary aspect-square">
                    <div className="flex h-8 w-8 mb-1 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">{item.label}</CardTitle>
                    {item.count !== null ? (
                      <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{item.count}</p>
                    ) : (
                      <p className="text-2xl font-bold text-transparent select-none" aria-hidden="true">&nbsp;</p>
                    )}
                </Card>
              </Link>
            ))}
          </>
        )}
      </div>

      {dashboardView === 'main' && (
        <Card className="flex flex-col bg-white/60 dark:bg-zinc-900/60 backdrop-blur-lg rounded-2xl shadow-lg border-white/20">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Sesiones de Hoy - {todayName}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filters.specialistId} onValueChange={(value) => handleFilterChange('specialistId', value)}>
                  <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                    <SelectValue placeholder="Especialista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Especialista</SelectItem>
                    {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.actividadId} onValueChange={(value) => handleFilterChange('actividadId', value)}>
                  <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                    <SelectValue placeholder="Actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Actividades</SelectItem>
                    {actividades.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.spaceId} onValueChange={(value) => handleFilterChange('spaceId', value)}>
                  <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                    <SelectValue placeholder="Espacio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Espacios</SelectItem>
                    {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.timeOfDay} onValueChange={(value) => handleFilterChange('timeOfDay', value)}>
                  <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-auto sm:flex-initial bg-white dark:bg-zinc-800 border-border shadow-sm rounded-xl">
                    <SelectValue placeholder="Horario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo el Día</SelectItem>
                    <SelectItem value="Mañana">Mañana</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noche">Noche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            {todaysSessions.length > 0 ? (
              filteredSessions.length > 0 ? (
                <ul className="space-y-4">
                  {filteredSessions.map(session => {
                    const { specialist,ividad, space } = getSessionDetails(session);
                    const enrolledCount = (session as any).enrolledCount;
                    const capacity = session.sessionType === 'Individual' ? 1 : space?.capacity ?? 0;
                    const utilization = capacity > 0 ? enrolledCount / capacity : 0;
                    const isFull = utilization >= 1;
                    const isNearlyFull = utilization >= 0.8 && !isFull;

                    const now = new Date();
                    const [hour, minute] = session.time.split(':').map(Number);
                    const sessionStartTime = new Date();
                    sessionStartTime.setHours(hour, minute, 0, 0);
                    const attendanceWindowStart = new Date(sessionStartTime.getTime() - 20 * 60 * 1000);
                    const isAttendanceAllowed = now >= attendanceWindowStart;
                    const tooltipMessage = isAttendanceAllowed ? "Pasar Lista" : "La asistencia se habilita 20 minutos antes de la clase.";

                    return (
                      <li 
                        key={session.id}
                        className={cn(
                          "flex items-center gap-4 rounded-xl border p-3 transition-all duration-200 bg-white/50 dark:bg-zinc-800/50 border-white/20 shadow-md hover:shadow-lg",
                          isFull && "bg-pink-500/20 border-pink-500/30",
                          isNearlyFull && "bg-amber-500/10 border-amber-500/20"
                        )}
                      >
                        <div className="flex-1 space-y-1 cursor-pointer" onClick={() => setSelectedSessionForStudents(session)}>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{actividad?.name || 'Sesión'}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1.5"><UserIcon className="h-4 w-4" />{specialist?.name || 'N/A'}</span>
                            <span className="flex items-center gap-1.5"><DoorOpen className="h-4 w-4" />{space?.name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                            <div>
                              <p className="font-bold text-primary">{formatTime(session.time)}</p>
                              <p className={cn(
                                "text-base font-semibold",
                                isFull 
                                  ? "text-pink-600 dark:text-pink-400" 
                                  : isNearlyFull 
                                  ? "text-amber-600 dark:text-amber-500" 
                                  : "text-slate-700 dark:text-slate-200"
                              )}>
                                {enrolledCount}/{capacity} inscriptos
                              </p>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-slate-600 dark:text-slate-300 hover:bg-white/50" onClick={() => setSessionForAttendance(session)} disabled={!isAttendanceAllowed}>
                                      <ClipboardCheck className="h-5 w-5" />
                                      <span className="sr-only">Pasar Lista</span>
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{tooltipMessage}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-10 text-center bg-white/20 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No se encontraron sesiones</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Prueba a cambiar o limpiar los filtros.</p>
                </div>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/30 p-10 text-center bg-white/20 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No hay sesiones hoy</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">¡Día libre! Disfruta del descanso.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSessionForStudents && (
         <EnrolledStudentsSheet 
            session={selectedSessionForStudents}
            onClose={() => setSelectedSessionForStudents(null)}
          />
      )}
      {sessionForAttendance && (
        <AttendanceSheet
          session={sessionForAttendance}
          onClose={() => setSessionForAttendance(null)}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  // useSearchParams causes de-optimization to client-side rendering.
  // We wrap the component in a Suspense boundary to avoid this.
  // This is a pattern recommended by the Next.js team.
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <DashboardPageContent />
    </React.Suspense>
  );
}
