import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge } from "@material-ui/core";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import { LogOut, Settings, Wallet, ServerCog, Users, Network, Paperclip, QrCode, Blocks, Sparkles, Megaphone, FolderCog, MessagesSquare, FastForward, FileStack, NotebookPen, BookUser, CalendarClock, Tag, CircleHelp, LayoutDashboard, ListCheck, UserSearch } from 'lucide-react';
import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { SocketContext } from "../context/Socket/SocketContext";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import usePlans from "../hooks/usePlans";
import Typography from "@material-ui/core/Typography";
import useVersion from "../hooks/useVersion";

const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
  activeText: {
    fontWeight: 'bold',
  },
  inactiveText: {
    fontWeight: 'normal',
  },
  selectedItem: {
    borderRadius: '5px !important',
    '&.Mui-selected': {
      backgroundColor: '#f4f4f5',
      borderRadius: '5px',
      '&:hover': {
        backgroundColor: '#f4f4f5',
        borderRadius: '5px',
      },
      '& .MuiTouchRipple-root': {
        backgroundColor: '#1e9c08',
        opacity: 0.3,
        borderRadius: '5px'
      },
      '& .MuiListItemIcon-root': {
        color: '#1f4518',
        '& svg': {
          color: '#1f4518',
          transition: 'color 0.2s ease'
        }
      }
    },
    '& .MuiTouchRipple-child': {
      backgroundColor: '#b5b5b5'
    },
    '&:hover': {
      backgroundColor: '#f4f4f5',
      borderRadius: '5px',
      transition: 'background-color 0.2s ease',
    }
  },
  logoutButton: {
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: theme.palette.sair.main,
    color: theme.palette.text.sair,
  }
}));

function ListItemLink(props) {
  const { icon, primary, to, className } = props;
  const location = useLocation();
  const classes = useStyles();
  const isActive = location.pathname === to;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button dense component={renderLink} className={`${className} ${classes.selectedItem}`} selected={isActive}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} classes={{
            primary: isActive ? classes.activeText : classes.inactiveText
          }}/>
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose, collapsed } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false); const history = useHistory();
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);


  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { getPlanCompany } = usePlans();
  
  const [version, setVersion] = useState(false);
  
  
  const { getVersion } = useVersion();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    async function fetchVersion() {
      const _version = await getVersion();
      setVersion(_version.version);
    }
    fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);

      setShowCampaigns(planConfigs.plan.useCampaigns);
      setShowKanban(planConfigs.plan.useKanban);
      setShowOpenAi(planConfigs.plan.useOpenAi);
      setShowIntegrations(planConfigs.plan.useIntegrations);
      setShowSchedules(planConfigs.plan.useSchedules);
      setShowInternalChat(planConfigs.plan.useInternalChat);
      setShowExternalApi(planConfigs.plan.useExternalApi);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    //handleCloseMenu();
    handleLogout();
  };

  return (
    <div onClick={drawerClose}>
      <Can
        role={user.profile}
        perform={"drawer-service-items:view"}
        style={{
          overflowY: "scroll",
        }}
        no={() => (
          <>
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">
              <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Atendimento")} </Typography>
            </ListSubheader>
            <>

              <ListItemLink
                to="/tickets"
                primary={i18n.t("mainDrawer.listItems.tickets")}
                icon={<WhatsAppIcon />}
              />
              <ListItemLink
                to="/quick-messages"
                primary={i18n.t("mainDrawer.listItems.quickMessages")}
                icon={<FastForward />}
              />
              {showKanban && (
                <ListItemLink
                  to="/kanban"
                  primary="CRM"
                  icon={<FileStack />}
                />
              )}
              <ListItemLink
                to="/todolist"
                primary={i18n.t("Tarefas")}
                icon={<NotebookPen />}
              />
              <ListItemLink
                to="/contacts"
                primary={i18n.t("mainDrawer.listItems.contacts")}
                icon={<BookUser />}
              />
              {showSchedules && (
                <>
                  <ListItemLink
                    to="/schedules"
                    primary={i18n.t("mainDrawer.listItems.schedules")}
                    icon={<CalendarClock />}
                  />
                </>
              )}
              <ListItemLink
                to="/tags"
                primary={i18n.t("mainDrawer.listItems.tags")}
                icon={<Tag />}
              />
              {showInternalChat && (
                <>
                  <ListItemLink
                    to="/chats"
                    primary={i18n.t("mainDrawer.listItems.chats")}
                    icon={
                      <Badge color="secondary" variant="dot" invisible={invisible}>
                        <MessagesSquare />
                      </Badge>
                    }
                  />
                </>
              )}
              <ListItemLink
                to="/helps"
                primary={i18n.t("mainDrawer.listItems.helps")}
                icon={<CircleHelp />}
              />
            </>
          </>
        )}
      />

      <Can
        role={user.profile}
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">

              <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Gerência")} </Typography>
            </ListSubheader>

            <ListItemLink
              small
              to="/"
              primary="Dashboard"
              icon={<LayoutDashboard />}
            />
          </>
        )}
      />
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>

            {showCampaigns && (
              <>
                <ListSubheader
                  hidden={collapsed}
                  style={{
                    position: "relative",
                    fontSize: "17px",
                    textAlign: "left",
                    paddingLeft: 20
                  }}
                  inset
                  color="inherit">
                  <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Campanhas")} </Typography>
                </ListSubheader>

                <ListItemLink
                  small
                  to="/campaigns"
                  primary={i18n.t("Listagem")}
                  icon={<ListCheck />}
                />

                <ListItemLink
                  small
                  to="/contact-lists"
                  primary={i18n.t("Listas de Contatos")}
                  icon={<UserSearch />}
                />


                <ListItemLink
                  small
                  to="/campaigns-config"
                  primary={i18n.t("Configurações")}
                  icon={<FolderCog />}
                />


                {/** 
                <ListItem
                  button
                  onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                >
                  <ListItemIcon>
                    <EventAvailableIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={i18n.t("mainDrawer.listItems.campaigns")}
                  />
                  {openCampaignSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openCampaignSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    
                    <ListItem onClick={() => history.push("/campaigns")} button>
                      <ListItemIcon>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listagem" />
                    </ListItem>

                    <ListItem
                      onClick={() => history.push("/contact-lists")}
                      button
                    >
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Listas de Contatos" />
                    </ListItem>

                    <ListItem
                      onClick={() => history.push("/campaigns-config")}
                      button
                    >
                      <ListItemIcon>
                        <SettingsOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText primary="Configurações" />
                    </ListItem>

                  </List>
                </Collapse>
                */}
              </>
            )}

            <ListSubheader
              hidden={collapsed}
              style={{
                position: "relative",
                fontSize: "17px",
                textAlign: "left",
                paddingLeft: 20
              }}
              inset
              color="inherit">
              <Typography variant="overline" style={{ fontWeight: 'normal' }}>  {i18n.t("Administração")} </Typography>
            </ListSubheader>

            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={<Megaphone />}
              />
            )}
            {showOpenAi && (
              <ListItemLink
                to="/prompts"
                primary={i18n.t("mainDrawer.listItems.prompts")}
                icon={<Sparkles />}
              />
            )}

            {showIntegrations && (
              <ListItemLink
                to="/queue-integration"
                primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                icon={<Blocks />}
              />
            )}
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                  <QrCode />
                </Badge>
              }
            />
            <ListItemLink
              to="/files"
              primary={i18n.t("mainDrawer.listItems.files")}
              icon={<Paperclip />}
            />
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<Network />}
            />
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<Users />}
            />
            {showExternalApi && (
              <>
                <ListItemLink
                  to="/messages-api"
                  primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                  icon={<ServerCog />}
                />
              </>
            )}
            <ListItemLink
              to="/financeiro"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={<Wallet />}
            />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<Settings />}
            />
			
			
            {!collapsed && (
              <React.Fragment>
                <Divider />
              {/* 
              // IMAGEM NO MENU
              <Hidden only={['sm', 'xs']}>
                <img style={{ width: "100%", padding: "10px" }} src={logo} alt="image" />            
              </Hidden> 
              */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px'
              }}>
                <Typography style={{ fontSize: "12px" }}>
                  Conexão Direta
                </Typography>
                <Typography style={{ fontSize: "12px"}}>
                  V: {`${version}`}
                </Typography>
              </div>
              </React.Fragment>
            )}
          </>
        )}
      />
	  <Divider />
	  <li>
		<ListItem
          button
          dense
          onClick={handleClickLogout}
          className={classes.logoutButton}
        >
          <ListItemIcon>
            <LogOut />
          </ListItemIcon>
          <ListItemText primary={i18n.t("Sair")} />
        </ListItem>
      </li>
    </div>
  );
};

export default MainListItems;
