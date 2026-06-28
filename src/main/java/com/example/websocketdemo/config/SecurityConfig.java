package com.example.websocketdemo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .authorizeRequests()
                .anyRequest().permitAll()
                .and()
                .oauth2Login()
                .authorizationEndpoint()
                .authorizationRequestResolver(new CustomAuthorizationRequestResolver(clientRegistrationRepository))
                .and()
                .defaultSuccessUrl("/index.html?login=google", true);
    }

    private static class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {
        private final OAuth2AuthorizationRequestResolver defaultResolver;

        public CustomAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
            this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                    clientRegistrationRepository, "/oauth2/authorization");
        }

        @Override
        public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
            OAuth2AuthorizationRequest authRequest = defaultResolver.resolve(request);
            return customize(authRequest);
        }

        @Override
        public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
            OAuth2AuthorizationRequest authRequest = defaultResolver.resolve(request, clientRegistrationId);
            return customize(authRequest);
        }

        private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest request) {
            if (request == null) {
                return null;
            }
            Map<String, Object> additionalParameters = new HashMap<>(request.getAdditionalParameters());
            additionalParameters.put("prompt", "select_account");
            return OAuth2AuthorizationRequest.from(request)
                    .additionalParameters(additionalParameters)
                    .build();
        }
    }
}
